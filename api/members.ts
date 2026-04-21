import type { VercelRequest, VercelResponse } from '@vercel/node';

async function fetchToBase64(url: string, token: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function extractFromStatus(html: string | undefined | null, keyword: string): string[] {
  if (!html) return [];
  
  // Convert block HTML tags to newlines before stripping remaining HTML to preserve lines
  let textPattern = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]*>?/gm, ''); 

  // Look for Keyword: and match everything up to the next newline OR the next known keyword indicator like "Skills:"
  // Instead of complex lookaheads, taking advantage of preserved newlines is cleaner.
  const regex = new RegExp(`${keyword}\\s*:\\s*([^\\n]+)`, 'i');
  const match = textPattern.match(regex);
  if (match && match[1]) {
    // There might be another keyword on the same line if they didn't use newlines. e.g "Expertise: A, B - Skills: C, D"
    // Let's strip anything after another keyword like "Skills:" or "Expertise:" if it sneaks in.
    let content = match[1];
    if (keyword.toLowerCase() === 'expertise') {
      content = content.split(/skills\s*:/i)[0]; // stop if hit skills
    } else if (keyword.toLowerCase() === 'skills') {
      content = content.split(/expertise\s*:/i)[0]; // stop if hit expertise
    }
    
    return content
      .replace(/[-|;]/g, ',') // Support common separators user might use instead of commas
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { groupId } = req.query;

  const TENANT_ID = process.env.TENANT_ID;
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  try {
    // 1. Get Token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        scope: "https://graph.microsoft.com/.default",
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenResponse.ok) {
      return res.status(500).json({ error: "Auth failed" });
    }

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Members (Include officeLocation, jobTitle, department)
    // We increase $top if needed, here top 50 is fine.
    const membersRes = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/members?$top=50&$select=id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!membersRes.ok) throw new Error(`Members fetch failed`);
    const membersData: any = await membersRes.json();
    const members = membersData.value || [];
    
    if (members.length === 0) {
      return res.status(200).json({ value: [] });
    }

    const memberIds = members.map((m: any) => m.id);

    // 3. Batch Fetch Presence for all members
    const presenceRes = await fetch(`https://graph.microsoft.com/v1.0/communications/getPresencesByUserId`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ids: memberIds })
    });
    
    let presences: any[] = [];
    if (presenceRes.ok) {
        const presenceData: any = await presenceRes.json();
        presences = presenceData.value || [];
    }

    const presenceMap = presences.reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
    }, {});

    // 4. Concurrently fetch Avatars (with allSettled to not break on errors like 404 No Photo)
    const avatarPromises = members.map(async (m: any) => {
      const avatarUrl = await fetchToBase64(`https://graph.microsoft.com/v1.0/users/${m.id}/photo/$value`, accessToken);
      return { id: m.id, avatarUrl };
    });
    
    const avatarResults = await Promise.allSettled(avatarPromises);
    const avatarMap = avatarResults.reduce((acc: any, result: any) => {
      if (result.status === 'fulfilled' && result.value) {
        acc[result.value.id] = result.value.avatarUrl;
      }
      return acc;
    }, {});


    // 5. Merge all Data
    const finalResults = members.map((m: any) => {
      const presence = presenceMap[m.id];
      const rawStatusHtml = presence?.statusMessage?.message?.content || "";
      
      const skills = extractFromStatus(rawStatusHtml, "Skills");
      const expertise = extractFromStatus(rawStatusHtml, "Expertise");

      return {
        id: m.id,
        displayName: m.displayName,
        mail: m.mail || m.userPrincipalName,
        jobTitle: m.jobTitle || "",
        department: m.department || "",
        location: m.officeLocation || "",
        presence: presence?.availability || "Offline", 
        rawStatus: rawStatusHtml,
        avatarUrl: avatarMap[m.id] || null,
        skills,
        expertise
      };
    });

    return res.status(200).json({ value: finalResults });

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
