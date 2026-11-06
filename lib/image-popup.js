// Get the image and insert it inside the modal - use its "alt" text as a caption
let modal, img, modalImg, captionText, captionDate, downloadDropdown, downloadButton;

function setupElements() {
	modal = document.getElementById("image-popup");
	img = document.getElementsByClassName("clickable-image");
	modalImg = document.getElementById("img01");
	captionText = document.getElementById("caption-text");
	captionDate = document.getElementById("caption-date");
	captionTags = document.getElementById("caption-tag-container");
	downloadDropdown = document.getElementById("popup-download-dropdown");
	downloadButton = document.getElementById("download-popup");

	img.onclick = function () {
		modal.style.display = "block";
		modalImg.src = this.src;
		captionText.innerHTML = this.alt;
	}

	modal.addEventListener("click", function (event) {
		if (event.target == modal) {
			close();
		}
	})

	modalImg.addEventListener('wheel', function (event) {
		modalImg.style.scale = Math.min(Math.max(parseFloat(modalImg.style.scale) + event.deltaY / 1000, 1), 10);
	})

	modalImg.addEventListener('mousedown', function (event) {
		if (modalImg.style.scale > 1) {
			console.log(event.cliHeiinnerHeight)
		}
	})

	document.getElementById("close-popup").onclick = function () {
		close();
	}

	downloadButton.onclick = function () {
		if (modalImg.src.includes(".avif")) {
			toggleDownloadDropdown();
		} else {
			download();
		}
	}

	document.getElementById("download-png").onclick = function () {
		downloadAsPng();
		toggleDownloadDropdown(false);
	}

	document.getElementById("download-avif").onclick = function () {
		download();
		toggleDownloadDropdown(false);
	}

	document.getElementById("download-newtab").onclick = function () {
		openNewTab();
		toggleDownloadDropdown(false);
	}

	document.getElementById("fullscreen-popup").onclick = function () {
		modalImg.requestFullscreen();
	}

	image_from_link();
}


const span = document.getElementById("close-popup");

function zoomOutMobile() {
	let viewport = document.querySelector('meta[name="viewport"]');

	if (viewport) {
		viewport.content = "initial-scale=0.1";
		viewport.content = "width=1200";
	}
}

function show_image(el) {
	modalImg.style.scale = 1;
	modal.style.display = "block";
	modal.style.opacity = "100%"
	document.body.style.overflow = "hidden";
	let src = el.src;
	if (src == "") {
		src = "/media/Artwork/" + el.getAttribute("filename") + ".avif";
	}

	modalImg.src = src
	if (document.getElementById("img-meta")) {
		document.getElementById("img-meta").setAttribute("src", src);
	}

	captionText.innerHTML = el.alt;
	captionDate.innerHTML = el.getAttribute("date-text");
	let tag_temp = captionTags.children[0]
	Array.from(captionTags.children).forEach(element => {
		captionTags.removeChild(element);
	})

	let tags = [];
	if (el.getAttribute("tags") != null) {
		tags = el.getAttribute("tags").split(',')
	}
	tags = tags
		.map(tag => tag.trim())
		.filter(tag => {
			const definition = (typeof database !== "undefined" && database && database.tags)
				? database.tags.find(t => t.name === tag)
				: null;
			return !definition || definition.visible !== false;
		});
	tags.forEach(tag => {
		tag_temp.textContent = tag
		captionTags.appendChild(tag_temp.cloneNode(true))
	})

	let url = new URL(window.location.href);
	if (url.searchParams.get("artwork") != el.getAttribute("filename")) {
		url.searchParams.append("artwork", el.getAttribute("filename"));
		window.history.pushState(null, "", url);
	}
}

function close() {
	document.body.style.overflow = null;
	let url = new URL(window.location.href);
	url.searchParams.delete("artwork");
	window.history.pushState(null, "", url);
	modal.style.opacity = null
	modalImg.style.animationDirection = "reverse";
	captionText.style.animationDirection = "reverse";
	modalImg.style.animationName = 'none';
	modalImg.offsetHeight; /* trigger reflow */
	modalImg.style.animationName = "zoom";
	captionText.style.animationName = 'none';
	captionText.offsetHeight; /* trigger reflow */
	captionText.style.animationName = "zoom";

	if (document.fullscreenElement) {
		document.exitFullscreen();
	}

	toggleDownloadDropdown(false);

	setTimeout(() => {
		modal.style.display = "none";
		modalImg.style.animationDirection = null;
		captionText.style.animationDirection = null;
		modalImg.setAttribute("src", "");
	}, 300);
}

function image_from_link() {
	setTimeout(() => {
		let url = new URL(window.location);
		if (url.searchParams.has("artwork")) {
			let arr = Array.from(document.getElementsByClassName("clickable-image"));
			arr.forEach(element => {
				if (element.getAttribute("filename") == url.searchParams.get("artwork")) {
					show_image(element);
					return;
				}
			});
			image_from_link()
		}
	}, 100);
}

function toggleDownloadDropdown(visible = downloadDropdown.hidden) {
	downloadDropdown.hidden = !visible;
}

function downloadAsPng() {

	const fullPath = modalImg.src;
	const originalFilename = fullPath.substring(fullPath.lastIndexOf('/') + 1);

	const pngFilename = originalFilename.replace(/\.[^/.]+$/, "") + ".png";

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	canvas.width = modalImg.naturalWidth;
	canvas.height = modalImg.naturalHeight;

	ctx.drawImage(modalImg, 0, 0);

	const pngUrl = canvas.toDataURL('image/png');

	const downloadLink = document.createElement('a');
	downloadLink.href = pngUrl;
	downloadLink.download = pngFilename;

	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
};

function download() {
	const filename = modalImg.src.substring(modalImg.src.lastIndexOf('/') + 1);

	const downloadLink = document.createElement('a');
	downloadLink.href = modalImg.src;
	downloadLink.download = filename;

	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
};

function openNewTab() {
	window.open(modalImg.src, '_blank').focus();
};

window.onload = function() {
	appendHTML();
}

async function appendHTML(filePath = "/image-popup.html") {
	try {
		const response = await fetch(filePath);

		if (!response.ok) {
			throw new Error(`Failed to load ${filePath}`);
		}

		const htmlText = await response.text();
		document.body.insertAdjacentHTML('beforeend', htmlText);

		setupElements();
	} catch (error) {
		console.error('Error appending HTML:', error);
	}
}