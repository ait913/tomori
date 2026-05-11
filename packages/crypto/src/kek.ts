import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";

export interface KEKProvider {
  current(): Promise<{ id: string; key: Buffer }>;
  byId(id: string): Promise<Buffer>;
}

function decodeBase64Key(value: string, name: string): Buffer {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error(`${name} must be base64 for 32 bytes`);
  }
  return key;
}

export class EnvKEKProvider implements KEKProvider {
  public async current(): Promise<{ id: string; key: Buffer }> {
    const raw = process.env.TOMORI_KEK_V1;
    if (!raw) {
      throw new Error("TOMORI_KEK_V1 is required for env KEK provider");
    }

    return { id: "env:v1", key: decodeBase64Key(raw, "TOMORI_KEK_V1") };
  }

  public async byId(id: string): Promise<Buffer> {
    if (id !== "env:v1") {
      throw new Error(`unknown env KEK id: ${id}`);
    }

    const raw = process.env.TOMORI_KEK_V1;
    if (!raw) {
      throw new Error("TOMORI_KEK_V1 is required for env KEK provider");
    }

    return decodeBase64Key(raw, "TOMORI_KEK_V1");
  }
}

export class KmsKEKProvider implements KEKProvider {
  private readonly client: KMSClient;

  public constructor(client = new KMSClient({})) {
    this.client = client;
  }

  public async current(): Promise<{ id: string; key: Buffer }> {
    const arn = process.env.TOMORI_KEK_KMS_KEY_ARN;
    const material = process.env.TOMORI_KEK_V1;
    if (!arn || !material) {
      throw new Error("TOMORI_KEK_KMS_KEY_ARN and TOMORI_KEK_V1 are required for kms KEK provider");
    }

    return { id: `kms:${arn}`, key: decodeBase64Key(material, "TOMORI_KEK_V1") };
  }

  public async byId(id: string): Promise<Buffer> {
    if (!id.startsWith("kms:")) {
      throw new Error(`unsupported kms id: ${id}`);
    }

    const ciphertext = process.env.TOMORI_KEK_V1_CIPHERTEXT;
    if (!ciphertext) {
      const fallback = process.env.TOMORI_KEK_V1;
      if (!fallback) {
        throw new Error("missing KMS KEK material");
      }
      return decodeBase64Key(fallback, "TOMORI_KEK_V1");
    }

    const response = await this.client.send(
      new DecryptCommand({
        KeyId: id.replace(/^kms:/, ""),
        CiphertextBlob: Buffer.from(ciphertext, "base64")
      })
    );

    if (!response.Plaintext) {
      throw new Error("KMS decrypt returned empty plaintext");
    }

    const key = Buffer.from(response.Plaintext);
    if (key.length !== 32) {
      throw new Error("KMS plaintext must be 32 bytes");
    }
    return key;
  }
}

export function createKEKProvider(): KEKProvider {
  return process.env.TOMORI_KEK_PROVIDER === "kms" ? new KmsKEKProvider() : new EnvKEKProvider();
}
