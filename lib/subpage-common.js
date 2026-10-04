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
const header = document.getElementById("header");
let expandedHeaderHeight = null;
const headerShrinkDistance = 200;

function updateHeaderSize() {
	if (expandedHeaderHeight === null) {
		const inlineHeight = header.style.height;
		header.style.removeProperty("height");
		expandedHeaderHeight = header.getBoundingClientRect().height;
		if (inlineHeight) header.style.height = inlineHeight;
	}

	const scroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
	const progress = Math.min(scroll / headerShrinkDistance, 1);
	const easedProgress = progress * progress * (3 - 2 * progress);
	const compactHeight = Math.min(80, expandedHeaderHeight);
	header.style.height = `${expandedHeaderHeight + (compactHeight - expandedHeaderHeight) * easedProgress}px`;
	if (headerText) headerText.style.fontSize = `${64 + (42 - 64) * easedProgress}px`;
}

window.addEventListener("scroll", updateHeaderSize, { passive: true });
window.addEventListener("resize", function () {
	expandedHeaderHeight = null;
	requestAnimationFrame(updateHeaderSize);
});
updateHeaderSize();