const orgs = {{ organizationsData.value }} || [];
return orgs.map((o) => ({ label: o.name, value: o.id }));