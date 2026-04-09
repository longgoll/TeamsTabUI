import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { groupId } = req.query;

  const TENANT_ID = process.env.TENANT_ID;
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Missing environment variables on server" });
  }

  try {
    // 1. Get Token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        scope: "https://graph.microsoft.com/.default",
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(401).json({ error: "Failed to obtain access token", details: tokenData });
    }

    // 2. Fetch Data from Graph
    const apiPath = groupId ? `groups/${groupId}/members` : "users";
    const graphResponse = await fetch(
      `https://graph.microsoft.com/v1.0/${apiPath}?$top=50&$select=id,displayName,mail,userPrincipalName`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const data = await graphResponse.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
