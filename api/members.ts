import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFParse } from 'pdf-parse';

async function extractInfoFromPDF(downloadUrlOrContentUrl: string, accessToken: string) {
  try {
    const response = await fetch(downloadUrlOrContentUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      console.error(`Fetch failed with status ${response.status} for ${downloadUrlOrContentUrl}`);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    
    // Sử dụng API của pdf-parse v2
    const parser = new PDFParse({ data: Buffer.from(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    
    const text = result.text;

    // Trích xuất Email bằng regex
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0].toLowerCase() : null;

    // Trích xuất Skills và Expertise (Hỗ trợ cả định dạng hàng dọc và dấu đầu dòng)
    const extractSection = (keyword: string) => {
      // Tìm từ khóa, sau đó lấy nội dung bên dưới cho đến khi gặp phần mới hoặc dấu tách trang
      const regex = new RegExp(`${keyword}(?:\\s*[:\\-]|\\s*\\n)\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\n[A-Z][a-z]+|\\n\\s*--|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1]
          .replace(/[•●▪*-]/g, '') // Xóa các ký tự bullet phổ biến
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 1 && !s.includes('--')) // Lọc bỏ dòng trống hoặc dòng đánh số trang
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
  } catch (error) {
    console.error("Error parsing PDF/Office file:", error);
    return null;
  }
}

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

    const tokenData: any = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(401).json({ error: "Failed to obtain access token" });
    }
    const accessToken = tokenData.access_token;

    // 2. Fetch Members from Graph
    const membersPath = groupId ? `groups/${groupId}/members` : "users";
    const membersResponse = await fetch(
      `https://graph.microsoft.com/v1.0/${membersPath}?$top=50&$select=id,displayName,mail,userPrincipalName,jobTitle,department`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const membersData: any = await membersResponse.json();
    const members = membersData.value || [];

    // 3. Fetch Files from General/Member Profiles
    let pdfDataMap: Record<string, any> = {};
    if (groupId) {
      try {
        const folderPath = "General/Member Profiles";
        const driveUrl = `https://graph.microsoft.com/v1.0/groups/${groupId}/drive/root:/${encodeURIComponent(folderPath)}:/children`;
        const driveResponse = await fetch(driveUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (driveResponse.ok) {
          const driveData: any = await driveResponse.json();
          // Hỗ trợ cả PDF và các file Office có thể convert sang PDF
          const supportedFiles = (driveData.value || []).filter((f: any) => {
            const name = f.name.toLowerCase();
            return name.endsWith('.pdf') || name.endsWith('.pptx') || name.endsWith('.docx') || name.endsWith('.doc');
          });

          // Lấy driveId từ kết quả drive response nếu cần (thường đã có trong metadata file)
          // Ở đây ta dùng cấu trúc URL /drives/{driveId}/items/{itemId}/content?format=pdf
          const driveIdRes = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/drive`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const driveInfo: any = await driveIdRes.json();
          const driveId = driveInfo.id;

          const results = await Promise.all(
            supportedFiles.map(async (file: any) => {
              let urlToFetch = file['@microsoft.graph.downloadUrl'];
              
              // Nếu không phải PDF, ta gọi endpoint convert sang PDF của Graph
              if (!file.name.toLowerCase().endsWith('.pdf')) {
                urlToFetch = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${file.id}/content?format=pdf`;
              }

              if (urlToFetch) {
                const info = await extractInfoFromPDF(urlToFetch, accessToken);
                return { filename: file.name, ...info };
              }
              return null;
            })
          );

          // Build a map
          results.filter(Boolean).forEach((item: any) => {
            if (item.email) {
              pdfDataMap[item.email] = item;
            }
            const emailInFilename = item.filename.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailInFilename) {
              pdfDataMap[emailInFilename[0].toLowerCase()] = item;
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch profiles:", err);
      }
    }

    // 4. Merge Data
    const finalResults = members.map((member: any) => {
      const email = (member.mail || member.userPrincipalName || "").toLowerCase();
      const pdfInfo = pdfDataMap[email];

      return {
        id: member.id,
        displayName: member.displayName,
        mail: member.mail,
        userPrincipalName: member.userPrincipalName,
        jobTitle: pdfInfo?.title || member.jobTitle || "",
        department: member.department || "",
        skills: (pdfInfo?.skills && pdfInfo.skills.length > 0) ? pdfInfo.skills.join(', ') : "",
        expertise: (pdfInfo?.expertise && pdfInfo.expertise.length > 0) ? pdfInfo.expertise.join(', ') : ""
      };
    });

    return res.status(200).json({ value: finalResults });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
