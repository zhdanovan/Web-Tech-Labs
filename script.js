
let countries = [];

async function loadCountries() {
  try {
    const response = await fetch('countries.json');
    if (!response.ok) {
      throw new Error('Не удалось загрузить данные о странах');
    }
    countries = await response.json();
    console.log('Данные о странах загружены:', countries);

    initializeInputListeners();
  } catch (error) {
    console.error('Ошибка при загрузке данных о странах:', error);
    alert('Произошла ошибка при загрузке данных о странах. Попробуйте позже.');
  }
}

loadCountries();

function initializeInputListeners() {
  const seriesInput = document.getElementById('seriesInput');
  const numberInput = document.getElementById('numberInput');

  seriesInput.addEventListener('input', updatePassportInfo);

  numberInput.addEventListener('input', updatePassportInfo);
}

function updatePassportInfo() {
  const series = document.getElementById('seriesInput').value.trim();
  const number = document.getElementById('numberInput').value.trim();

  let country = null;

  if (series.length === 4) {
    country = countries.find(c => c['country-code'] === '643'); 
  } else if (series.length === 3) {
    country = countries.find(c => c['country-code'] === series);
  }
  if (country) {
    document.getElementById('series').textContent = series;
    document.getElementById('number').textContent = number;
    document.getElementById('citizenship').textContent = country.name || "Неизвестная страна";
    document.getElementById('flag').textContent = country['alpha-2'] || '';
  } else {
    document.getElementById('series').textContent = series;
    document.getElementById('number').textContent = number;
    document.getElementById('citizenship').textContent = 'Неизвестная страна';
    document.getElementById('flag').textContent = ''; 
}
}