// ✅ Main DOM references
const panel = document.getElementById('infoPanel');
const content = document.getElementById('infoContent');
const addBtn = document.getElementById("addCafeBtn");
const form = document.getElementById("addCafeForm");
const submitBtn = document.getElementById("submitCafe");
const cancelBtn = document.getElementById("cancelCafe");
let leafletMap;

// ✅ Open Panel (with optional scroll lock for mobile)
function openPanel(name, description, img, lat, lng, keywords) {
  if (window.innerWidth <= 768) {
    document.body.style.overflow = "hidden";
  }

  content.innerHTML = `
    <img src="${img}" />
    <h3>${name}</h3>
    <p>${description}</p>
    <p style="font-style: italic; color: #6c5c4c;">${keywords}</p>
    <div id="map" style="height: 200px; margin-top: 1rem; border-radius: 6px;"></div>
  `;

  panel.classList.add('active');

  setTimeout(() => {
    if (leafletMap) leafletMap.remove();
    leafletMap = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);
    L.marker([lat, lng]).addTo(leafletMap);
  }, 200);
}

// ✅ Close Panel + scroll reset
function closePanel() {
  document.body.style.overflow = "auto";
  panel.classList.remove('active');
}

// ✅ Load localStorage on start
function loadSavedCards() {
  const saved = JSON.parse(localStorage.getItem("cafeCards")) || [];
  saved.forEach(data => createCafeCard(data));
}
document.addEventListener("DOMContentLoaded", loadSavedCards);

// ✅ Click handler for existing cards
const staticCards = document.querySelectorAll('.cafe-card');
staticCards.forEach(card => {
  card.addEventListener("click", (e) => {
    if (card.dataset.moved === "true") {
      e.stopImmediatePropagation();
      card.dataset.moved = "false";
      return;
    }
    const name = card.dataset.name;
    const desc = card.dataset.description;
    const img = card.dataset.img;
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    const keywords = card.dataset.keywords || "";
    openPanel(name, desc, img, lat, lng, keywords);
  });
  makeDraggable(card);
});

// ✅ Show form
addBtn.addEventListener("click", () => {
  form.style.display = "block";
});

// ✅ Cancel form
cancelBtn.addEventListener("click", () => {
  form.style.display = "none";
});

// ✅ Geocode address to lat/lng
async function getLatLngFromAddress(address) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const data = await res.json();
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } else {
    alert("주소를 찾을 수 없습니다.");
    return null;
  }
}

// ✅ Submit new cafe
submitBtn.addEventListener("click", async () => {
  const name = document.getElementById("cafeName").value;
  const desc = document.getElementById("cafeDesc").value;
  const img = document.getElementById("cafeImg").value;
  const address = document.getElementById("cafeAddress").value;
  const keywords = prompt("카페 키워드 (예: #연남동 #소금빵 #뷰맛집)");

  if (!name || !desc || !img || !address) return alert("모든 항목을 입력해주세요!");

  const coords = await getLatLngFromAddress(address);
  if (!coords) return;

  const cardData = {
    name,
    description: desc,
    img,
    lat: coords.lat,
    lng: coords.lon,
    keywords: keywords || "#카페"
  };

  saveCard(cardData);
  createCafeCard(cardData);
  form.style.display = "none";
});

// ✅ Save to localStorage
function saveCard(cardData) {
  const saved = JSON.parse(localStorage.getItem("cafeCards")) || [];
  saved.push(cardData);
  localStorage.setItem("cafeCards", JSON.stringify(saved));
}

// ✅ Create new cafe card DOM
function createCafeCard({ name, description, img, lat, lng, keywords }) {
  const card = document.createElement("div");
  card.classList.add("cafe-card");
  card.style.left = Math.random() * (window.innerWidth - 200) + "px";
  card.style.top = Math.random() * (window.innerHeight - 300) + "px";
  card.setAttribute("data-name", name);
  card.setAttribute("data-description", description);
  card.setAttribute("data-img", img);
  card.setAttribute("data-lat", lat);
  card.setAttribute("data-lng", lng);
  card.setAttribute("data-keywords", keywords);

  card.innerHTML = `
    <img src="${img}" draggable="false" />
    <span class="filename">${name.toUpperCase().replace(/ /g, "_")}.JPG</span>
  `;

  card.addEventListener("click", (e) => {
    if (card.dataset.moved === "true") {
      e.stopImmediatePropagation();
      card.dataset.moved = "false";
      return;
    }
    openPanel(name, description, img, parseFloat(lat), parseFloat(lng), keywords);
  });

  makeDraggable(card);
  document.body.appendChild(card);
}

// ✅ Make a card draggable (desktop + mobile)
function makeDraggable(card) {
  let moved = false;

  // Desktop
  card.addEventListener('mousedown', function (e) {
    e.preventDefault();
    moved = false;

    let shiftX = e.clientX - card.getBoundingClientRect().left;
    let shiftY = e.clientY - card.getBoundingClientRect().top;

    card.style.position = 'absolute';
    card.style.zIndex = 10000;
    card.style.cursor = 'grabbing';

    function onMouseMove(e) {
      moved = true;
      card.dataset.moved = "true";
      card.style.left = e.pageX - shiftX + 'px';
      card.style.top = e.pageY - shiftY + 'px';
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', function () {
      document.removeEventListener('mousemove', onMouseMove);
      card.style.cursor = 'grab';
    }, { once: true });
  });

  // Mobile
  card.addEventListener("touchstart", function (e) {
    e.preventDefault();
    moved = false;

    const touch = e.touches[0];
    let shiftX = touch.clientX - card.getBoundingClientRect().left;
    let shiftY = touch.clientY - card.getBoundingClientRect().top;

    function onTouchMove(e) {
      moved = true;
      const touch = e.touches[0];
      card.style.left = touch.pageX - shiftX + 'px';
      card.style.top = touch.pageY - shiftY + 'px';
    }

    function onTouchEnd() {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    }

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: false });
  });

  card.addEventListener('mouseenter', () => {
    card.style.cursor = 'grab';
  });
}