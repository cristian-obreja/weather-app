const API_GEOLOCATION_URL = "https://geocoding-api.open-meteo.com/v1/search";
const API_FORCAST_URL = "https://api.open-meteo.com/v1/forecast";

const cityForm = document.querySelector('#cityForm');
const locationBtn = document.querySelector('#locationBtn');

cityForm.addEventListener('submit',onCityFormSubmit);
locationBtn.addEventListener('click',onLocationBtnClick);

async function onCityFormSubmit(event){
    event.preventDefault();

    clearContent();

    const cityInput = cityForm.querySelector('#city');
    const cityName = cityInput.value.trim();

    if(!cityName){
        displayError("Introduceti numele unui oras");
        return;
    }
    displayLoading();

   try {
    const cityCordnates =  await getCityCoordinates(cityName);

    if(cityCordnates === null){
        hideLoading();
        displayError(`Nu s-au putut prelua coordonatele orasului ${cityName}`);
        return;
    }

    const weatherResponse = await getWeather(cityCordnates.lat,cityCordnates.long);
    const weatherData = parseAPIData(weatherResponse);
    console.log(weatherData);
    hideLoading();
    displayWeather(cityName, weatherData);

    cityInput.value = "";
   }catch(error){
    hideLoading();
    displayError(` aparut o eroare ${error}`)


   }




}
function onLocationBtnClick(){
    clearContent();
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(async position =>{
            displayLoading();

    try {
    const weatherResponse = await getWeather(position.coords.latitude,position.coords.longitude);
    const weatherData = parseAPIData(weatherResponse);
    console.log(weatherData);
    hideLoading();
    displayWeather("locatia ta", weatherData);

   }catch(error){
    hideLoading();
    displayError(` aparut o eroare ${error}`)


   }

        })
    }else{
        displayError("API-ul pentru geolocation nu este disponibil");
    }
}

async function getCityCoordinates(cityName){
    const apiUrl = new URL(API_GEOLOCATION_URL);
    apiUrl.searchParams.append('name', cityName);
    apiUrl.searchParams.append('count', 1);
    console.log(apiUrl.toString());


    const response = await fetch(apiUrl.toString())
    const data = await response.json();


    if(!data || !data.hasOwnProperty("results") ){
        return null;
    }
    const result = data.results[0];

    return{lat: result.latitude,long:result.longitude}

    
}
async function getWeather(lat,long){
   // https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code
    const apiUrl = new URL(API_FORCAST_URL);
    apiUrl.searchParams.append("latitude",lat);
    apiUrl.searchParams.append("longitude",long);
    apiUrl.searchParams.append("timezone","auto");
    apiUrl.searchParams.append("hourly","temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code");
    console.log(apiUrl.toString());


    const response = await fetch(apiUrl.toString());
    const data = await response.json();
    return data;
}

function parseAPIData(data){
    const numberOfItems = data.hourly.time.length;
    let currentWeather = null;
    const forecasts =[];
    const currentDatetime = new Date();



    for(let i = 0; i<numberOfItems;i++){
        const itemDatetime = new Date(data.hourly.time[i]);

        const isToday = currentDatetime.toDateString() === itemDatetime.toDateString();
        const isCurrentHour = currentDatetime.getHours() === itemDatetime.getHours();


        if(isToday && isCurrentHour){
            currentWeather = {
                date: data.hourly.time[i],
                temp: data.hourly.temperature_2m[i],
                wind: data.hourly.wind_speed_10m[i],
                humidity: data.hourly.relative_humidity_2m[i],
                code: data.hourly.weather_code[i],
            };
        }

        else if(isCurrentHour){
            forecasts.push({
                date: data.hourly.time[i],
                temp: data.hourly.temperature_2m[i],
                wind: data.hourly.wind_speed_10m[i],
                humidity: data.hourly.relative_humidity_2m[i],
                code: data.hourly.weather_code[i],
            });

        }
    }

    return{
        current: currentWeather,
        forecasts:forecasts
    }


}
function displayWeather(cityName, weather){
    const pageContent = document.querySelector(".page-content")

    pageContent.append(createTodayWeathersSection(cityName, weather.current));
    pageContent.append(createForecastWeathersSection(cityName, weather.forecasts));
}
function createTodayWeathersSection(cityName, currentWeather){
    const todaySection = document.createElement('div');

    const title = document.createElement("h2");
    title.classList.add("section-title")
    title.classList.add('section-title');
    title.innerText = `Vremea in ${cityName} astazi`

    todaySection.append(title);

    const weatherPanel = createWeatherPanel(currentWeather, true);
    todaySection.append(weatherPanel);
    return todaySection;
    
}
function createForecastWeathersSection(cityName,forecast){
    const forecastSection = document.createElement('div');
    const title = document.createElement("h2");
    title.classList.add("section-title")
    title.classList.add('section-title');
    title.innerText = `Vremea in ${cityName} in urmatoarele zile`;
    forecastSection.append(title);

    const weatherItems = document.createElement("div");
    weatherItems.classList.add("weather-items");

    forecastSection.append(weatherItems);

    for(let i = 0; i<forecast.length; i++){
        const weatherPanel = createWeatherPanel(forecast[i],false);
        weatherItems.append(weatherPanel);
    }
    return forecastSection;
}





function createWeatherPanel(weather, isToday){
    const weatherPanel = document.createElement('div');
    const panelClass = isToday ? "today" : "forecast";

    weatherPanel.classList.add("weather-panel",panelClass);

    const weatherDetails = document.createElement('div');
    weatherDetails.classList.add("weather-details");
    weatherPanel.append(weatherDetails);

    const currentHour = new Date().getHours();
    const isNight = currentHour >= 20 || currentHour <= 6;
    const weatherIcon = getIcon(weather.code, isNight);


    const imageContainer = document.createElement("div");
    const icon = document.createElement("img");
    icon.src = weatherIcon;

    imageContainer.append(icon);
    weatherPanel.append(imageContainer);


    const date = document.createElement('p');
    date.classList.add("data");
    date.innerText = weather.date.replace("T",", ")

    const temp = document.createElement("p");
    temp.innerText =`Temperatura : ${weather.temp} °C`;

    const wind = document.createElement("p");
    wind.innerText =`Vant : ${weather.wind} km/h`;

    const humidity = document.createElement("p");
    humidity.innerText =`Umiditate : ${weather.humidity} %`;

    weatherDetails.append(date,temp,wind,humidity);
    return weatherPanel;


}
function getIcon(code,isNight){
     switch (code) {
    case 0:
      return isNight ? 'weather-icons/night.svg' : 'weather-icons/sunny.svg';
    case 1:
    case 2:
    case 3:
      return isNight
        ? 'weather-icons/cloudy-night.svg'
        : 'weather-icons/cloudy-day.svg';
    case 45:
    case 48:
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return 'weather-icons/cloudy.svg';
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return 'weather-icons/rainy.svg';
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return 'weather-icons/snowy.svg';
    case 95:
    case 96:
    case 99:
      return 'weather-icons/thunder.svg';
    default:
      return isNight ? 'weather-icons/night.svg' : 'weather-icons/sunny.svg';
  }
}
function clearContent(){
    const pageContent = document.querySelector('.page-content');
    pageContent.innerHTML = "";
}
function displayLoading(){
    const pageContent = document.querySelector('.page-content');
    const loading = document.createElement("p");
    loading.setAttribute("id", "loading");
    loading.innerText = "Se incarca datele despre vreme";
    pageContent.append(loading);

}
function hideLoading(){
    const loading = document.querySelector("#loading");
    if(loading){
        loading.remove();
    }
}
function displayError(message){
    const pageContent = document.querySelector(".page-content")
    const alert = document.createElement("div");
    alert.classList.add("alert-error");
    alert.innerText = message;
    pageContent.append(alert);
}
