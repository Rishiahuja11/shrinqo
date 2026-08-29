// Test that Turso HTTP writes work
const TURSO_URL = 'libsql://shrinqo-rishiahuja11.aws-ap-south-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc5OTg4NDksImlkIjoiMDFhMDQ2OGUtYTkwMS03NDI0LWFiMDAtOGViMDU5NDFmMjNkIiwia2lkIjoiOTdLTmd3LXVua0JrblY2ektSSGxPaUxTZHRaeEJOM2FmT2xsY0ZNSXJFSSIsInJpZCI6ImNkMGVjZmIwLWRjMDEtNDEzYi04YzA4LTk1MzUyNDJiNzAxMyJ9.HYwq9mhvvWeVsnL3LgpSrBKD4m5VUD5G7MwmhFgOg9_ETKIfd0dykME07ZCC1B_ZCEr88YbaqyzYDKFIsa6-CQ';
const httpUrl = TURSO_URL.replace(/^libsql:\/\//, 'https://');

async function testWrite() {
  console.log('HTTP URL:', httpUrl);

  // 1. INSERT a test link
  const insertSql = "INSERT OR IGNORE INTO links (id,kind,url,text_content,name,type,size,hash,chunks,clicks,owner,created,github_owner,github_repo,github_branch,github_commit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
  const args = ['TESTWX', 'url', 'https://example.com', null, null, null, 0, null, 0, 0, null, new Date().toISOString(), '', '', '', ''];

  console.log('\n1. INSERT via HTTP...');
  const res = await fetch(httpUrl + '/v2/pipeline', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TURSO_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ statements: [{ sql: insertSql, args: args }] })
  });
  const body = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', body.slice(0, 500));

  // 2. READ back
  console.log('\n2. SELECT via HTTP...');
  const res2 = await fetch(httpUrl + '/v2/pipeline', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TURSO_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ statements: [{ sql: "SELECT id, url, created FROM links WHERE id = 'TESTWX'" }] })
  });
  const body2 = await res2.text();
  console.log('Status:', res2.status);
  console.log('Response:', body2.slice(0, 500));

  // 3. DELETE test row
  console.log('\n3. DELETE test row...');
  const res3 = await fetch(httpUrl + '/v2/pipeline', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TURSO_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ statements: [{ sql: "DELETE FROM links WHERE id = 'TESTWX'" }] })
  });
  console.log('Delete status:', res3.status);
}

testWrite().catch(e => console.error('FATAL:', e));
