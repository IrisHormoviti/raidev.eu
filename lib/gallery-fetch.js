

//import data from '/gallery/art-database.json' with { type: "json" };
let database


let imgs = new Array();
const gallery = document.querySelector('.gallery-container')
const loader = document.querySelector('.gallery-loader')
const folder = "/media/Artwork/";
let tag_template = document.querySelector('.tag-button')
let tagsDrawn = false
let tag_focus = null
let years = new Array();

fetch('/gallery/art-database.json')
	.then(response => response.json())
	.then(data => {
		database = data
		loadGallery();
});

function loadGallery() {
	for (const picdata of database.artwork) {
		const img = new Image();

		img.classList.add("clickable-image", "gallery-img");
		img.addEventListener('click', () => show_image(img));

		const date = new Date(picdata.date + "T00:00:00");

		img.setAttribute("date", Date.parse(date));
		img.setAttribute("filename", picdata.filename);
		img.setAttribute("decoding", "async");
		img.setAttribute('alt', picdata.description || picdata.title);
		img.setAttribute("date-text", date.getFullYear() + " " + date.toLocaleString('en-us', { month: 'short' }) + " "+ date.getDate());
		img.setAttribute('tags', picdata.tags);
		img.width = picdata.width;
		img.height = picdata.height;
		img.loading = "lazy";
		img.style.width = "100%";
		img.style.height = "auto";
		img.style.aspectRatio = `${picdata.width} / ${picdata.height}`;

		if (picdata.tags.includes("wide")) {
			img.classList.add("gallery-img-wide");
		}

		const sourceFolder = picdata.tags.includes("not-mine") ? folder + "NotMine/" : folder;
		img.src = sourceFolder + picdata.filename + ".avif";

		imgs.push(img);
	}

	tagCheck();

	const fragment = document.createDocumentFragment();
	for (const img of imgs) {
		fragment.appendChild(img);
	}
	gallery.appendChild(fragment);

	layoutGallery();
	loader.style.display = 'none';
}

const GALLERY_ROW_HEIGHT = 10;

function layoutGallery() {
	const style = getComputedStyle(gallery);
	const columns = style.gridTemplateColumns.split(" ").filter(Boolean).length;
	const columnGap = parseFloat(style.columnGap) || 0;
	const rowGap = parseFloat(style.rowGap) || 0;
	const rowHeight = parseFloat(style.gridAutoRows) || GALLERY_ROW_HEIGHT;
	const galleryWidth = gallery.getBoundingClientRect().width;
	const columnWidth = (galleryWidth - columnGap * (columns - 1)) / columns;

	for (const img of imgs) {
		const data = picdata(img);
		if (!data || !data.width || !data.height) continue;

		const isWide = img.classList.contains("gallery-img-wide");
		const itemWidth = isWide ? columnWidth * 2 + columnGap : columnWidth;
		let height = itemWidth * data.height / data.width;

		if (!isWide) {
			height = Math.min(height, 550);
		}

		const span = Math.ceil((height + rowGap + 1) / (rowHeight + rowGap));
		img.style.gridRowEnd = `span ${span}`;
	}
}

let layoutTimer;
window.addEventListener("resize", () => {
	clearTimeout(layoutTimer);
	layoutTimer = setTimeout(layoutGallery, 100);
});

function sortGallery() {
	let arr = Array.from(document.getElementsByClassName("gallery-year"));
	arr.forEach(element => {
		if (!years.includes(element.getAttribute("alt"))) {
			element.style.display = "none";
		}
	});
	years.forEach(year => {
		let el = document.createElement('div');
		el.setAttribute('class', "gallery-img gallery-year");
		let date = new Date(year, 11, 30);
		el.setAttribute("date", Date.parse(date));
		el.innerHTML = year;
		el.setAttribute('alt', year);
		imgs.push(el);
	});
	imgs.sort(function(x, y) {
		if (x.getAttribute("date") > y.getAttribute("date")) return -1;
		if (x.getAttribute("date") < y.getAttribute("date")) return 1;
		return 0
	});
	console.log(years);
}

function tagCheck() {
	const defaultTag = database.tags.find((tag) => tag.kind === "featured") || database.tags[0];
	const hash = window.location.hash.substring(1);
	const isDefault = hash == "" || hash == defaultTag.name;
	const section = isDefault ? defaultTag.name : hash;

	drawTagButtons();

	tag_template.style.display = 'none';
	tag_template.classList.remove('tag-button-front');

	for (const img of imgs) {
		img.setAttribute("show", "block");
		img.style.display = 'block';
	}

	if (isDefault) {
		document.querySelector('.gallery-tag-title').innerText = defaultTag.title;
		tag_unexpand();
		document.querySelectorAll('#tag-container .tag-button').forEach((btn) => {
			btn.classList.remove('tag-button-selected');
		});
		tag_focus = null;
	} else {
		tag_template.style.display = 'unset';
		tag_template.classList.add('tag-button-front');
		tagPress(section);
	}

	const current = tagdata(section);
	const excluded = current ? current.exclude || [] : [];

	years = [];

	for (const img of imgs) {
		let picdat = picdata(img);
		if (picdat != null) {
			const exclusiveTags = picdat.tags.filter((tag) => {
				const definition = tagdata(tag);
				return definition && definition.exclusive;
			});
			const hiddenByExclusive = exclusiveTags.length > 0 && !exclusiveTags.includes(section);
			const hiddenByExclude = excluded.some((tag) => picdat.tags.includes(tag));

			if (hiddenByExclusive || hiddenByExclude) {
				img.setAttribute("show", "none");
				img.style.display = 'none';
			}
			if (img.style.display !== 'none' && !years.includes(picdat.date.substring(0,4))) {
				years.push(picdat.date.substring(0,4));
			}
		} else {
			img.style.display = 'block';
		}
	}

	sortGallery();
};

function tagPress(section) {
	window.location.href = "#" + section;

	document.querySelector('.gallery-tag-title').innerText = database.tags.find((tag) => tag.name == section).title;

	window.scrollTo(0, -50);

	for (const img of imgs) {
		let data = picdata(img);

		if (data != null) {
			if (data.tags.find((tag) => tag == section) != undefined) {
				img.setAttribute('show', "block");
				img.style.display = 'block';
			} else {
				img.setAttribute('show', "none");
				img.style.display = 'none';
			}
		}
	}
};

function picdata(img) {
	return database.artwork.find( (data) =>
		data.filename == img.getAttribute("filename")
	)
};


function tagdata(wanted) {
	return database.tags.find((tag) => tag.name == wanted);
}

window.addEventListener('hashchange',() => {
	console.log("tag changed");
	tagCheck();

	if (window.location.hash == "") {
		if (tag_focus != null) tag_focus.classList.remove("tag-button-selected");
		tag_focus = null;
	}
});

function drawTagButtons() {
	if (tagsDrawn) return;
	tagsDrawn = true;

	const hash = window.location.hash.substring(1);

	for (const tag of database.tags) {
		if (tag.name != "" && tag.visible !== false) {
			const btn = document.createElement('button');
			btn.classList.add('tag-button');
			btn.innerHTML = `${tag.icon ? `<img class='tag-icon' src='${tag.icon}'>` : ''}${tag.title}`;
			btn.onclick = function() {
				focusBtn(this);
				window.location.hash = tag.name;
			};
			document.querySelector("#tag-container").append(btn);
			if (hash && tag.name == hash) {
				focusBtn(btn, 1000);
			}
		}
	}
};

function focusBtn(btn, delay = 0) {
	tag_unexpand();
	setTimeout( function() {
		btn.scrollIntoView({ behavior: "smooth", block: "center", inline: "center"});
		btn.focus();
		btn.classList.add("tag-button-selected");
		if (tag_focus != null) tag_focus.classList.remove("tag-button-selected");
		tag_focus = btn;
	}, delay);
};