let countries = [];
let worldMap = null;
let barChart = null;

async function loadCountries() {
  try {
    const response = await fetch('countries.json');
    if (!response.ok) {
      throw new Error('Не удалось загрузить данные о странах');
    }
    countries = await response.json();
    console.log('Данные о странах загружены:', countries);

    const mapResponse = await fetch('world.svg');
    if (!mapResponse.ok) {
      throw new Error('Не удалось загрузить карту мира');
    }
    const mapSvg = await mapResponse.text();
    document.getElementById('worldMap').innerHTML = mapSvg;
    worldMap = document.getElementById('worldMap').querySelector('svg');

    initializeInputListeners();
    updateMap();
    updateBarChart();
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    alert('Произошла ошибка при загрузке данных. Попробуйте позже.');
  }
}

loadCountries();

function initializeInputListeners() {
  const seriesInput = document.getElementById('seriesInput');
  const numberInput = document.getElementById('numberInput');
  const passportForm = document.getElementById('passportForm');
  const clearBtn = document.getElementById('clearDataBtn');

  seriesInput.addEventListener('input', updatePassportInfo);
  numberInput.addEventListener('input', updatePassportInfo);
  passportForm.addEventListener('submit', handleFormSubmit);
  clearBtn.addEventListener('click', clearAllData);
}

function handleFormSubmit(event) {
  event.preventDefault();
  const series = document.getElementById('seriesInput').value.trim();
  const number = document.getElementById('numberInput').value.trim();
  
  if (series.length < 3 || number.length !== 6) {
    alert('Пожалуйста, введите корректные данные паспорта');
    return;
  }

  let country = null;
  if (series.length === 4) {
    country = countries.find(c => c['country-code'] === '643');
  } else if (series.length === 3) {
    country = countries.find(c => c['country-code'] === series);
  }

  if (country) {
    savePassportData(series, number, country);
    event.target.reset();
  } else {
    alert('Не удалось определить страну по серии паспорта');
  }
}

function savePassportData(series, number, country) {
  const passports = JSON.parse(localStorage.getItem('passports')) || [];
  
  const isDuplicate = passports.some(passport => 
    passport.series === series && passport.number === number
  );
  
  if (isDuplicate) {
    alert('Такой паспорт уже существует!');
    return;
  }


  const countryName = country.name;
  
  passports.push({
    series,
    number,
    country: {
      name: countryName,
      code: country['country-code'],
      alpha2: country['alpha-2']
    },
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem('passports', JSON.stringify(passports));
  updateMap();
  updateBarChart();
  alert('Паспорт успешно сохранен!');
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

  document.getElementById('series').textContent = series;
  document.getElementById('number').textContent = number;
  document.getElementById('citizenship').textContent = country ? country.name : 'Неизвестная страна';
  document.getElementById('flag').textContent = country ? country['alpha-2'] : '';
}

function updateMap() {
  if (!worldMap) return;

  const passports = JSON.parse(localStorage.getItem('passports')) || [];
  const countryCounts = {};

  passports.forEach(passport => {
    const countryName = passport.country.name;
    countryCounts[countryName] = (countryCounts[countryName] || 0) + 1;
  });

  worldMap.querySelectorAll('path').forEach(path => {
    const countryClass = path.getAttribute('class');
    const count = countryCounts[countryClass] || 0;
    
    if (count > 0) {
      const intensity = Math.min(count * 20, 100);
      path.style.fill = `rgba(0, 128, 255, ${intensity / 100})`;
    } else {
      path.style.fill = '#ccc';
    }

    path.addEventListener('mousemove', (e) => {
      const tooltip = document.getElementById('mapTooltip');
      const tooltipText = count > 0 
        ? `${countryClass}: ${count} паспорт${count === 1 ? '' : (count < 5 && count > 1 ? 'а' : 'ов')}`
        : `${countryClass}: нет паспортов`;
      
      tooltip.innerHTML = tooltipText;
      
      const rect = path.getBoundingClientRect();
      const mapRect = worldMap.getBoundingClientRect();
      
      const tooltipX = rect.left + (rect.width / 2) - mapRect.left;
      const tooltipY = rect.top - mapRect.top - 40; 
      
      tooltip.style.left = `${tooltipX}px`;
      tooltip.style.top = `${tooltipY}px`;
      tooltip.classList.add('show');
    });

    path.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById('mapTooltip');
      tooltip.classList.remove('show');
    });
  });
}

function clearAllData() {
  if (confirm('Вы уверены, что хотите удалить все данные и очистить карту?')) {
    localStorage.removeItem('passports');
    updateMap();
    updateBarChart();
    alert('Все данные удалены!');
  }
}

function updateBarChart() {
  const passports = JSON.parse(localStorage.getItem('passports')) || [];
  const countryCounts = {};
  passports.forEach(passport => {
    const countryName = passport.country.name;
    countryCounts[countryName] = (countryCounts[countryName] || 0) + 1;
  });
  const labels = Object.keys(countryCounts);
  const data = Object.values(countryCounts);

  const ctx = document.getElementById('barChart').getContext('2d');
  if (barChart) {
    barChart.destroy();
  }
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Паспорта',
        data: data,
        backgroundColor: 'rgba(26, 77, 77, 0.7)',
        borderColor: 'rgba(26, 77, 77, 1)',
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 60
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.parsed.y} паспорт${context.parsed.y === 1 ? '' : (context.parsed.y < 5 && context.parsed.y > 1 ? 'а' : 'ов')}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Страна', color: '#1a4d4d', font: { weight: 'bold', size: 16 } },
          ticks: { color: '#333', font: { size: 14 } }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Количество паспортов', color: '#1a4d4d', font: { weight: 'bold', size: 16 } },
          ticks: { color: '#333', font: { size: 14 }, precision: 0 }
        }
      }
    }
  });
}

