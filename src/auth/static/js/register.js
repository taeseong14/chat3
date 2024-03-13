const form = document.querySelector('form');
form.onsubmit = (e) => {
    e.preventDefault();
    alert('recaptcha 로드중입니다. 몇 초만 기다려주세요.');
}

let tok = '';

form.addEventListener('click', () => {
    refreshToken().then(token => {
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (![...form].every(e => e.tagName == 'INPUT' && e.value || e.tagName == 'BUTTON')) return alert('빈 칸이 있습니다.');
            const res = await new F('/register').post({
                token: tok || token,
                id: form[0].value,
                pw: form[1].value,
                name: form[2].value,
            });
            if (res.err) {
                tok = await refreshToken();
                return alert(res.err);
            }
            console.log(res.result);
            const search = new URLSearchParams(location.search);
            if (res.result === 'success') location.replace(search.get('re') || '/chat')
        }
        setInterval(() => {
            refreshToken().then(t => tok = t);
        }, 2 * 60 * 1000);
    });
    function refreshToken() {
        return new Promise(res => {
            grecaptcha.ready(function () {
                grecaptcha.execute('6Ldr4o8mAAAAAHa-lnlbxnAZb4a2pBiCcJbASYfP', { action: 'submit' })
                    .then(res)
            });
        });
    }
}, { once: true });
