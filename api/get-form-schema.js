export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let formUrl = req.query.url || "https://docs.google.com/forms/d/e/1FAIpQLSchR5l0jsUZq2M3I85zoadpypH_hxRxUC9PCFrAhFlhEIjXMw/viewform";

  try {
    const headRes = await fetch(formUrl, { redirect: 'follow' });
    const html = await headRes.text();
    const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(.*?);\s*<\/script>/s);

    if (match) {
      const data = JSON.parse(match[1]);
      const title = data[1][8] || data[1][0] || "Assessment";
      const rawItems = data[1][1] || [];
      const questions = [];

      // Check if email collection is enabled
      const emailSettings = data[1][10];
      const collectsEmail = Boolean(emailSettings && (emailSettings[1] === 1 || emailSettings[6] === 3 || emailSettings[3] === 2));

      rawItems.forEach(item => {
        if (item[4] && item[4][0]) {
          const entryId = item[4][0][0];
          const options = item[4][0][1] ? item[4][0][1].map(o => o[0]) : [];
          const required = item[4][0][2] === 1;
          const typeCode = item[3]; // 2: radio, 4: checkbox, 0: short text, 1: paragraph

          questions.push({
            id: entryId,
            entryName: `entry.${entryId}`,
            title: item[1],
            type: typeCode === 4 ? "checkbox" : options.length > 0 ? "radio" : "text",
            required,
            options
          });
        }
      });

      const formIdPart = data[14] || 'e/1FAIpQLSchR5l0jsUZq2M3I85zoadpypH_hxRxUC9PCFrAhFlhEIjXMw';
      const actionUrl = formIdPart.startsWith('e/')
        ? `https://docs.google.com/forms/d/${formIdPart}/formResponse`
        : `https://docs.google.com/forms/d/e/${formIdPart}/formResponse`;

      return res.status(200).json({
        success: true,
        title,
        collectsEmail,
        actionUrl,
        questions
      });
    }

    return res.status(200).json({
      success: false,
      message: "Could not extract FB_PUBLIC_LOAD_DATA_"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
