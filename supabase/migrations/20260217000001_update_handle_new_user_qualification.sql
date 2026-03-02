CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  org_name text;
  base_slug text;
  org_slug text;
  new_org_id uuid;
  i int := 0;
  v_church_role text;
  v_needs_tech boolean;
  v_willing_pay_tech boolean;
  v_owns_business boolean;
  v_business_desc text;
  v_business_email text;
  v_desired_tools text;
  v_marketing_consent boolean;
BEGIN
  user_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'donor');
  IF user_role NOT IN ('donor', 'organization_admin', 'platform_admin') THEN
    user_role := 'donor';
  END IF;

  -- Parse qualification metadata
  v_church_role := NULLIF(TRIM(NEW.raw_user_meta_data->>'church_role'), '');
  v_needs_tech := LOWER(COALESCE(NEW.raw_user_meta_data->>'needs_tech_integration_help', '')) IN ('true', 'yes', '1');
  v_willing_pay_tech := LOWER(COALESCE(NEW.raw_user_meta_data->>'willing_to_pay_tech_help', '')) IN ('true', 'yes', '1');
  v_owns_business := LOWER(COALESCE(NEW.raw_user_meta_data->>'owns_business_outside_church', '')) IN ('true', 'yes', '1');
  v_business_desc := NULLIF(TRIM(NEW.raw_user_meta_data->>'business_description'), '');
  v_business_email := NULLIF(TRIM(NEW.raw_user_meta_data->>'business_email'), '');
  v_desired_tools := NULLIF(TRIM(NEW.raw_user_meta_data->>'desired_tools'), '');
  v_marketing_consent := LOWER(COALESCE(NEW.raw_user_meta_data->>'marketing_consent', '')) IN ('true', 'yes', '1');

  IF user_role = 'organization_admin' AND NEW.raw_user_meta_data->>'organization_name' IS NOT NULL THEN
    org_name := TRIM(NEW.raw_user_meta_data->>'organization_name');
    IF length(org_name) > 0 THEN
      base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
      base_slug := regexp_replace(base_slug, '-+$', '');
      IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'org-' || substr(NEW.id::text, 1, 8);
      END IF;
      org_slug := base_slug;
      WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) LOOP
        i := i + 1;
        org_slug := base_slug || '-' || i;
        EXIT WHEN i > 999;
      END LOOP;

      INSERT INTO public.organizations (name, slug, owner_user_id)
      VALUES (org_name, org_slug, NEW.id)
      RETURNING id INTO new_org_id;

      INSERT INTO public.user_profiles (id, email, full_name, role, organization_id, church_role, needs_tech_integration_help, willing_to_pay_tech_help, owns_business_outside_church, business_description, business_email, desired_tools, marketing_consent)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        user_role,
        new_org_id,
        v_church_role,
        v_needs_tech,
        v_willing_pay_tech,
        v_owns_business,
        v_business_desc,
        v_business_email,
        v_desired_tools,
        v_marketing_consent
      )
      ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        church_role = COALESCE(EXCLUDED.church_role, user_profiles.church_role),
        needs_tech_integration_help = COALESCE(EXCLUDED.needs_tech_integration_help, user_profiles.needs_tech_integration_help),
        willing_to_pay_tech_help = COALESCE(EXCLUDED.willing_to_pay_tech_help, user_profiles.willing_to_pay_tech_help),
        owns_business_outside_church = COALESCE(EXCLUDED.owns_business_outside_church, user_profiles.owns_business_outside_church),
        business_description = COALESCE(EXCLUDED.business_description, user_profiles.business_description),
        business_email = COALESCE(EXCLUDED.business_email, user_profiles.business_email),
        desired_tools = COALESCE(EXCLUDED.desired_tools, user_profiles.desired_tools),
        marketing_consent = COALESCE(EXCLUDED.marketing_consent, user_profiles.marketing_consent);
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.user_profiles (id, email, full_name, role, church_role, needs_tech_integration_help, willing_to_pay_tech_help, owns_business_outside_church, business_description, business_email, desired_tools, marketing_consent)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role,
    v_church_role,
    v_needs_tech,
    v_willing_pay_tech,
    v_owns_business,
    v_business_desc,
    v_business_email,
    v_desired_tools,
    v_marketing_consent
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    church_role = COALESCE(EXCLUDED.church_role, user_profiles.church_role),
    needs_tech_integration_help = COALESCE(EXCLUDED.needs_tech_integration_help, user_profiles.needs_tech_integration_help),
    willing_to_pay_tech_help = COALESCE(EXCLUDED.willing_to_pay_tech_help, user_profiles.willing_to_pay_tech_help),
    owns_business_outside_church = COALESCE(EXCLUDED.owns_business_outside_church, user_profiles.owns_business_outside_church),
    business_description = COALESCE(EXCLUDED.business_description, user_profiles.business_description),
    business_email = COALESCE(EXCLUDED.business_email, user_profiles.business_email),
    desired_tools = COALESCE(EXCLUDED.desired_tools, user_profiles.desired_tools),
    marketing_consent = COALESCE(EXCLUDED.marketing_consent, user_profiles.marketing_consent);
  RETURN NEW;
END;
$function$;
