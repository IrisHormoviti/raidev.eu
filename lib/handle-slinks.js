function handleSlinks() {
	const social_links = document.getElementById("social-links");
	const panel = document.getElementById("slink-dropdown-panel");
	const button = document.getElementById("slink-dropdown-button");
	const icon = document.getElementById("slink-dropdown-icon");

	if (button == null) {
		setTimeout(function () {
			handleSlinks();
		}, 1000);
		return
	}
	button.onclick = function () {
		if (panel.classList.contains("open")) {
			social_links.classList.remove("open");
			panel.classList.remove("open");
			icon.classList.remove("fa-xmark");
			button.classList.remove("slink-pressed");
		} else {
			social_links.classList.add("open");
			panel.classList.add("open");
			icon.classList.add("fa-solid");
			icon.classList.add("fa-xmark");
			button.classList.add("slink-pressed");
		}
	};
}

document.addEventListener("DOMContentLoaded", function () {
	includeHTML();
	setTimeout(function () {
		handleSlinks();
	}, 500);
});