function setWidth() {
	const mvp = document.getElementById('vp');
	if (window.innerWidth < 500) {
		mvp.setAttribute('content', 'width=500px');
		console.log("mobile mode");
	} else {
		mvp.setAttribute('content', 'width=device-width');
		console.log("swakrop mode");
	}
};

window.addEventListener("load", setWidth());

function homeButton(link = '/') {
	document.body.classList.add("page-dismiss");

	setTimeout(function () {
		window.location.href = link;
	}, 200);
}

window.addEventListener('pageshow', function (event) {
	if (event.persisted) {
		window.location.reload();
	}
});

const headerText = document.querySelector("#header-cont h1")

window.onscroll = function () {
	if (!headerText) return;

	const scroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);

	if (scroll > 100) {
		document.getElementById("header").style.height = "80px";
		headerText.style.fontSize = "42px";
	} else if ((scroll == 0)) {
		document.getElementById("header").style.height = "140px";
		headerText.style.fontSize = "64px";
	}
}