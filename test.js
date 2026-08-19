fetch("https://avaeduc.com.br/login/index.php").then(r => r.text()).then(t => require("fs").writeFileSync("out.html", t)).catch(console.error)
