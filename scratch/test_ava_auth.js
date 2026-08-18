async function testLoginWithCookie(username, password) {
  try {
    // 1. Faz GET primeiro para obter a sessão MoodleSession
    const pageRes = await fetch('https://www.avaeduc.com.br/login/index.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    });

    const rawCookies = pageRes.headers.get('set-cookie') || '';
    const moodleMatch = rawCookies.match(/MoodleSession=([^;]+)/);
    const sessionCookie = moodleMatch ? `MoodleSession=${moodleMatch[1]}` : '';

    console.log('Initial Cookie obtained:', sessionCookie);

    // 2. Faz POST com o Cookie de sessão obtido
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const postRes = await fetch('https://www.avaeduc.com.br/login/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.avaeduc.com.br/login/index.php',
        'Cookie': sessionCookie
      },
      body: formData.toString(),
      redirect: 'manual'
    });

    console.log('POST Status:', postRes.status);
    console.log('Location:', postRes.headers.get('location'));
    console.log('Set-Cookie after POST:', postRes.headers.get('set-cookie'));

  } catch (e) {
    console.error('Error:', e);
  }
}

testLoginWithCookie('00851895298', 'teste123');
