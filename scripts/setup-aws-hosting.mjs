#!/usr/bin/env node
/**
 * One-time setup for AWS static site hosting.
 *
 * Creates:
 *   1. S3 bucket for published sites
 *   2. CloudFront distribution with S3 origin
 *   3. Lambda@Edge function for host-based routing
 *   4. Initial domain-map.json in S3
 *
 * Prerequisites:
 *   - AWS credentials in .env.local (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
 *   - Lambda edge-router built: cd lambda/edge-router && npm i && npm run build
 *
 * Usage: node scripts/setup-aws-hosting.mjs [bucket-name]
 *
 * After running, add the output values to .env.local:
 *   AWS_HOSTING_BUCKET=...
 *   AWS_CLOUDFRONT_DISTRIBUTION_ID=...
 *   AWS_CLOUDFRONT_DOMAIN=...
 */

import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

import {
  CloudFrontClient,
  CreateDistributionCommand,
  CreateOriginAccessControlCommand,
} from "@aws-sdk/client-cloudfront";

import {
  LambdaClient,
  CreateFunctionCommand,
  GetFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  PublishVersionCommand,
} from "@aws-sdk/client-lambda";

import {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
  GetRoleCommand,
} from "@aws-sdk/client-iam";

import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const BUCKET_NAME = process.argv[2] || "give-published-sites";
const REGION = "us-east-1"; // Lambda@Edge + CloudFront require us-east-1
const FUNCTION_NAME = "give-edge-router";
const ROLE_NAME = "give-edge-router-role";

// ---------------------------------------------------------------------------
// Env & credentials
// ---------------------------------------------------------------------------

function loadEnv() {
  for (const base of [projectRoot, process.cwd()]) {
    const envPath = resolve(base, ".env.local");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        const raw = trimmed.slice(eq + 1).trim();
        const value = raw.replace(/^["']|["']$/g, "").trim();
        if (key && !process.env[key]) process.env[key] = value;
      }
      break;
    }
  }
}

function getCredentials() {
  const id = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  if (!id || !secret) {
    throw new Error("Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local");
  }
  return { accessKeyId: id, secretAccessKey: secret };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  loadEnv();
  const credentials = getCredentials();

  const sts = new STSClient({ region: REGION, credentials });
  const { Account: accountId } = await sts.send(new GetCallerIdentityCommand({}));
  console.log(`AWS Account: ${accountId}`);

  const s3 = new S3Client({ region: REGION, credentials });
  const cf = new CloudFrontClient({ region: REGION, credentials });
  const lambda = new LambdaClient({ region: REGION, credentials });
  const iam = new IAMClient({ region: REGION, credentials });

  // ─── Step 1: Create S3 bucket ───
  console.log(`\n1. Creating S3 bucket: ${BUCKET_NAME}`);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log("   Bucket already exists");
  } catch {
    await s3.send(
      new CreateBucketCommand({
        Bucket: BUCKET_NAME,
        // us-east-1 doesn't use LocationConstraint
      })
    );
    console.log("   Bucket created");
  }

  // Seed domain-map.json
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "_domains/domain-map.json",
      Body: JSON.stringify({}, null, 2),
      ContentType: "application/json",
    })
  );
  console.log("   Seeded _domains/domain-map.json");

  // ─── Step 2: Create IAM role for Lambda@Edge ───
  console.log(`\n2. Setting up IAM role: ${ROLE_NAME}`);
  let roleArn;
  try {
    const existing = await iam.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
    roleArn = existing.Role?.Arn;
    console.log(`   Role exists: ${roleArn}`);
  } catch {
    const trustPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Service: ["lambda.amazonaws.com", "edgelambda.amazonaws.com"],
          },
          Action: "sts:AssumeRole",
        },
      ],
    };

    const created = await iam.send(
      new CreateRoleCommand({
        RoleName: ROLE_NAME,
        AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
        Description: "Give app Lambda@Edge router role",
      })
    );
    roleArn = created.Role?.Arn;

    await iam.send(
      new AttachRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      })
    );

    // S3 read access for domain-map.json
    await iam.send(
      new AttachRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyArn: "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
      })
    );

    console.log(`   Role created: ${roleArn}`);
    console.log("   Waiting 10s for IAM propagation...");
    await new Promise((r) => setTimeout(r, 10000));
  }

  // ─── Step 3: Build & deploy Lambda@Edge ───
  console.log(`\n3. Deploying Lambda@Edge: ${FUNCTION_NAME}`);
  const edgeDir = resolve(projectRoot, "lambda/edge-router");

  if (!existsSync(resolve(edgeDir, "node_modules"))) {
    console.log("   Installing edge-router dependencies...");
    execSync("npm install", { cwd: edgeDir, stdio: "inherit" });
  }

  console.log("   Building edge-router...");
  execSync("npm run build", { cwd: edgeDir, stdio: "inherit" });

  // Create zip from dist
  const distPath = resolve(edgeDir, "dist/index.mjs");
  if (!existsSync(distPath)) {
    throw new Error("Edge router build failed: dist/index.mjs not found");
  }

  execSync("cd dist && zip -j ../dist.zip index.mjs", { cwd: edgeDir, stdio: "inherit" });
  const zipBuffer = readFileSync(resolve(edgeDir, "dist.zip"));

  let lambdaArn;
  try {
    const existing = await lambda.send(new GetFunctionCommand({ FunctionName: FUNCTION_NAME }));
    lambdaArn = existing.Configuration?.FunctionArn;
    console.log("   Updating existing function code...");
    await lambda.send(
      new UpdateFunctionCodeCommand({
        FunctionName: FUNCTION_NAME,
        ZipFile: zipBuffer,
      })
    );
    await new Promise((r) => setTimeout(r, 5000));

    // Clear any env vars (Lambda@Edge cannot have them)
    console.log("   Clearing environment variables...");
    await lambda.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: FUNCTION_NAME,
        Environment: { Variables: {} },
      })
    );
    await new Promise((r) => setTimeout(r, 5000));
  } catch {
    console.log("   Creating new function...");
    const created = await lambda.send(
      new CreateFunctionCommand({
        FunctionName: FUNCTION_NAME,
        Runtime: "nodejs18.x",
        Handler: "index.handler",
        Role: roleArn,
        Code: { ZipFile: zipBuffer },
        MemorySize: 128,
        Timeout: 5,
        Description: "Give app edge router - maps Host to S3 org folder",
        // Lambda@Edge cannot have environment variables — bucket name is hardcoded in source
      })
    );
    lambdaArn = created.FunctionArn;
    await new Promise((r) => setTimeout(r, 5000));
  }

  // Publish a version (Lambda@Edge requires a specific version, not $LATEST)
  console.log("   Publishing Lambda version...");
  const published = await lambda.send(
    new PublishVersionCommand({ FunctionName: FUNCTION_NAME })
  );
  const versionedArn = published.FunctionArn;
  console.log(`   Published: ${versionedArn}`);

  // ─── Step 4: Create CloudFront OAC ───
  console.log("\n4. Creating CloudFront Origin Access Control");
  let oacId;
  try {
    const oac = await cf.send(
      new CreateOriginAccessControlCommand({
        OriginAccessControlConfig: {
          Name: `give-sites-oac-${Date.now()}`,
          OriginAccessControlOriginType: "s3",
          SigningBehavior: "always",
          SigningProtocol: "sigv4",
          Description: "OAC for Give published sites bucket",
        },
      })
    );
    oacId = oac.OriginAccessControl?.Id;
    console.log(`   OAC created: ${oacId}`);
  } catch (err) {
    console.error("   OAC creation failed:", err.message);
  }

  // ─── Step 5: Create CloudFront distribution ───
  console.log("\n5. Creating CloudFront distribution");
  const s3Origin = `${BUCKET_NAME}.s3.${REGION}.amazonaws.com`;

  const dist = await cf.send(
    new CreateDistributionCommand({
      DistributionConfig: {
        CallerReference: `give-sites-${Date.now()}`,
        Comment: "Give published sites",
        Enabled: true,
        DefaultRootObject: "index.html",
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: "s3-origin",
              DomainName: s3Origin,
              ...(oacId
                ? {
                    OriginAccessControlId: oacId,
                    S3OriginConfig: { OriginAccessIdentity: "" },
                  }
                : {
                    S3OriginConfig: { OriginAccessIdentity: "" },
                  }),
            },
          ],
        },
        DefaultCacheBehavior: {
          TargetOriginId: "s3-origin",
          ViewerProtocolPolicy: "redirect-to-https",
          AllowedMethods: {
            Quantity: 2,
            Items: ["GET", "HEAD"],
            CachedMethods: { Quantity: 2, Items: ["GET", "HEAD"] },
          },
          ForwardedValues: {
            QueryString: false,
            Cookies: { Forward: "none" },
            Headers: { Quantity: 1, Items: ["Host"] },
          },
          MinTTL: 0,
          DefaultTTL: 300,
          MaxTTL: 3600,
          Compress: true,
          LambdaFunctionAssociations: {
            Quantity: 1,
            Items: [
              {
                EventType: "viewer-request",
                LambdaFunctionARN: versionedArn,
                IncludeBody: false,
              },
            ],
          },
        },
        ViewerCertificate: {
          CloudFrontDefaultCertificate: true,
        },
        PriceClass: "PriceClass_100",
        HttpVersion: "http2and3",
        CustomErrorResponses: {
          Quantity: 1,
          Items: [
            {
              ErrorCode: 403,
              ResponseCode: 404,
              ResponsePagePath: "/404.html",
              ErrorCachingMinTTL: 60,
            },
          ],
        },
      },
    })
  );

  const distId = dist.Distribution?.Id;
  const distDomain = dist.Distribution?.DomainName;
  console.log(`   Distribution ID: ${distId}`);
  console.log(`   Domain: ${distDomain}`);

  // ─── Step 6: Set S3 bucket policy for CloudFront OAC ───
  if (oacId && distId) {
    console.log("\n6. Setting S3 bucket policy for CloudFront access");
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "AllowCloudFrontOAC",
          Effect: "Allow",
          Principal: { Service: "cloudfront.amazonaws.com" },
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
          Condition: {
            StringEquals: {
              "AWS:SourceArn": `arn:aws:cloudfront::${accountId}:distribution/${distId}`,
            },
          },
        },
      ],
    };

    await s3.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(bucketPolicy),
      })
    );
    console.log("   Bucket policy set");
  }

  // ─── Done ───
  console.log("\n" + "=".repeat(60));
  console.log("Setup complete! Add these to .env.local:\n");
  console.log(`AWS_HOSTING_BUCKET="${BUCKET_NAME}"`);
  console.log(`AWS_CLOUDFRONT_DISTRIBUTION_ID="${distId}"`);
  console.log(`AWS_CLOUDFRONT_DOMAIN="${distDomain}"`);
  console.log("\nAlso add them to Vercel env vars for production.");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\nSetup failed:", err);
  process.exit(1);
});
