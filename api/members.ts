import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';

async function extractInfoFromPDF(downloadUrlOrContentUrl: string, accessToken: string) {
  try {
    const response = await fetch(downloadUrlOrContentUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fetch failed for file: ${response.status} - ${errorText}`);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    
    // Sử dụng API của pdf-parse v1.1.1 (Thuần JS - Ổn định trên Vercel)
    const result = await pdf(Buffer.from(buffer));
    const text = result.text;

    // Trích xuất Email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0].toLowerCase() : null;

    // Trích xuất Skills và Expertise (Hỗ trợ cả định dạng hàng dọc và dấu đầu dòng)
    const extractSection = (keyword: string) => {
      const regex = new RegExp(`${keyword}(?:\\s*[:\\-]|\\s*\\n)\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\n[A-Z][a-z]+|\\n\\s*--|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1]
          .replace(/[•●▪*-]/g, '')
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 1 && !s.includes('--'))
          .join(', ');
      }
      return '';
    };

    return {
      email,
      skills: extractSection('Skills'),
      expertise: extractSection('Expertise'),
      title: (text.match(/Title[:\s]+([^\n]+)/i) || [])[1]?.trim() || null
    };
  } catch (error: any) {
    console.error("Error in extractInfoFromPDF:", error.message);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { groupId } = req.query;

  const TENANT_ID = process.env.TENANT_ID;
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ 
      error: "Missing environment variables", 
      env: { 
        tenant: !!TENANT_ID, 
        client: !!CLIENT_ID, 
        secret: !!CLIENT_SECRET 
      } 
    });
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
      const errorText = await tokenResponse.text();
      return res.status(500).json({ error: "Auth failed", details: errorText });
    }

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Members & Drive
    const [membersRes, driveRes] = await Promise.all([
      fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/members?$top=50&$select=id,displayName,mail,userPrincipalName,jobTitle,department`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/drive`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);

    if (!membersRes.ok) throw new Error(`Members fetch failed: ${membersRes.status}`);
    if (!driveRes.ok) throw new Error(`Drive fetch failed: ${driveRes.status}`);

    const membersData: any = await membersRes.json();
    const driveData: any = await driveRes.json();
    const members = membersData.value || [];
    const driveId = driveData.id;

    // 3. Process Profiles
    let pdfDataMap: Record<string, any> = {};
    const folderPath = "General/Member Profiles";
    const filesRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(folderPath)}:/children`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (filesRes.ok) {
      const filesData: any = await filesRes.json();
      const supportedFiles = (filesData.value || []).filter((f: any) => {
        const name = f.name.toLowerCase();
        return name.endsWith('.pdf') || name.endsWith('.pptx') || name.endsWith('.docx') || name.endsWith('.doc');
      });

      console.log(`Processing ${supportedFiles.length} files...`);

      const profileResults = await Promise.all(
        supportedFiles.map(async (file: any) => {
          let url = file['@microsoft.graph.downloadUrl'];
          if (!file.name.toLowerCase().endsWith('.pdf')) {
            url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${file.id}/content?format=pdf`;
          }
          if (url) {
            const info = await extractInfoFromPDF(url, accessToken);
            if (info) return { filename: file.name, ...info };
          }
          return null;
        })
      );

      profileResults.forEach((item: any) => {
        if (!item) return;
        if (item.email) pdfDataMap[item.email] = item;
        const emailMatch = item.filename.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) pdfDataMap[emailMatch[0].toLowerCase()] = item;
      });
    }

    // 4. Merge
    const finalResults = members.map((m: any) => {
      const email = (m.mail || m.userPrincipalName || "").toLowerCase();
      const info = pdfDataMap[email];
      return {
        id: m.id,
        displayName: m.displayName,
        mail: m.mail || m.userPrincipalName,
        jobTitle: info?.title || m.jobTitle || "Member",
        department: m.department || "",
        skills: info?.skills || "",
        expertise: info?.expertise || ""
      };
    });

    return res.status(200).json({ value: finalResults });

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: error.stack 
    });
  }
}
