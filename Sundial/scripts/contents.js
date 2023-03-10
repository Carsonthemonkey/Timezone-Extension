const timeZones = {
    "MOUNTAIN" : "MST",
    "GREENWICH" : "GMT",
    "INDIAN" : "UTC+5:30",
    "CENTRAL" : "CST",
    "CT" : "CST",
    "AKST" : "UTC-9",
    "HST" : "UTC-10",
    "ET" : "EST",
    "EASTERN" : "EST",
    "PACIFIC" : "PST",
    "PDT" : "UTC-7",
    "EDT" : "UTC-4",
    "PT" : "PST",
    "CET" : "UTC+1",
    "MSK" : "UTC+3",
    "IST" : "UTC+5:30",
    "JST" : "UTC+9",
    "AEDT" : "UTC+11",
    "NZDT" : "UTC+13",
    "BST" : "UTC+1",
    "HAWAII" : "UTC-10",
    "ALASKA" : "UTC-9"
}

const ZONESREGEX = /(UTC|GMT|ES?T|CST|MST|PS?T|AKST|HST|AEDT|BST|EASTERN|PACIFIC|CENTRAL|JST|CT|IST|NZDT|MSK|CET|MOUNTAIN|GREENWICH|INDIAN|HAWAII|ALASKA|HAWAII)/gi;
const AMPMREGEX = /((P\.?M\.?\s?)|(A\.?M\.?\s?))[\s,()]*/gi
const TIMEREGEX = /(\d{1,2})(:\d{2})?(:\d{2})?[\s,.]*/gi

let hasEditedPage = false;
const infoBoxText = document.querySelector("#sundial-info-box-text")
const SUPPORTEDTIMEZONES = ["UTC","GMT","EST","CST","MST","PST","GMT","UTC"];
const infoBox = document.createElement("div")
infoBox.innerHTML = "<span id=\"sundial-info-box-text\">\"ORIGINAL TIME PLACEHOLDER\"</span>"
console.log(infoBoxText)
const cssLink = document.createElement("link")
cssLink.href = "../styles/content.css"
cssLink.type = "text/css"
cssLink.rel = "stylesheet"

window.onload = startup;

function startup(){
    chrome.storage.sync.get('enableState').then((result) => {
        if(result.enableState){
            sundial();
        }
    });
}

//receive message from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("content script: " + request.message + "")
    if(request.message == "Enable" && !hasEditedPage){
        sundial();
    }
    else if(request.message == "Enable"){
        showReplacedTime();
        hideOriginalTime();
    }
    else{
        hideInfoBox();
        showOriginalTime();
        hideReplacedTime();
    }
});


function sundial(){
    document.head.appendChild(cssLink)
    infoBox.id = "sundial-info-box-container"
    document.body.appendChild(infoBox)


    hasEditedPage = true;
    const supportedElements = "*"
    // const timeMatchRegExp = /(\d{1,2})(:\d{2})?(:\d{2})?[\s,.]*((P.?M.?\s?)|(A.?M.?\s?))[\s,]*(UTC|GMT|ES?T|CST|MST|PS?T|AKST|HST|AEDT|BST|EASTERN|PACIFIC|CENTRAL|JST|CT|IST|NZDT|MSK|CET|MOUNTAIN|GREENWICH|INDIAN|HAWAII|ALASKA|HAWAII)/gi;
    const timeMatchRegExp = new RegExp(`${TIMEREGEX.source}${AMPMREGEX.source}${ZONESREGEX.source}`, "gi")
    console.log("timeMatchRegExp" + timeMatchRegExp)

    const elements = document.body.querySelectorAll(supportedElements);
    for(let element of elements){
        for(let child of element.childNodes){
            if(child.nodeType === 3){
                const text = child.nodeValue;
                const replaced = text.replace(timeMatchRegExp, convertTime);
                if(replaced !== text){
                    const span = document.createElement("span");
                    span.innerHTML = replaced;
                    child.replaceWith(span);
                }
            }            
        }
    }
    timeReplacedArray = document.querySelectorAll(".sundial-time-replace");
    for (const timeReplace of timeReplacedArray) {
        console.log("adding event listener to time replace element")
        timeReplace.addEventListener("mouseover", showInfoBox);
        timeReplace.addEventListener("mouseout", hideInfoBox);
    }
    hideOriginalTime();

    const timeReplaceElements = document.querySelectorAll(".sundial-time-replace");
    const originalTimeElements = document.querySelectorAll(".original-time")
}

function timeToDate(timeString){
    timeString = timeString.replace(/\./g, '').toUpperCase();
    let timeMatch = timeString.match(new RegExp(TIMEREGEX.source), "i")[0];
    let zoneMatch = timeString.match(new RegExp(ZONESREGEX.source), "i")[0];
    let timeArray = timeMatch.split(/:|[\s]+/);
    let formattedDate = "01 Jan 2023 ";
    //add hours to the date
    if(timeString.match(/P.?M.?/i)){
        formattedDate += (parseInt(timeArray[0])%12 + 12) + ":";
    }
    else{
        formattedDate += parseInt(timeArray[0]%12) + ":";
    }

    //add minutes
    if(timeArray.length > 1){
        formattedDate += timeArray[1] + ":"
    }
    else{
        formattedDate += "00:"
    }

    //add seconds
    if(timeArray.length > 3){
        formattedDate += timeArray[2] + ":"
    }
    else{
        formattedDate += "00 "
    }
    let tz = zoneMatch.toUpperCase().trim();
    if(!SUPPORTEDTIMEZONES.includes(tz)){
        formattedDate += timeZones[tz];
    }
    else{
        formattedDate += tz;
    }   
    
    let date = new Date(Date.parse(formattedDate));
    return date
}

function convertTime(timeString){
    console.log(timeString)
    
    let date = timeToDate(timeString);
    if(date.toDateString() != "Sun Jan 01 2023"){
        return timeString; 
    }
    let shownDate = date.toLocaleTimeString()
    shownDate = shownDate.substring(0, shownDate.length - 6) + ' ' + shownDate.substring(shownDate.length - 2, shownDate.length)
    return `<span class="original-time">${timeString}</span><span class=\"sundial-time-replace\" id="${timeString}">${shownDate}</span>`; //the id thing is probably messy
}

function showInfoBox(event){
    //TODO: show sundial-info box with original time
    infoBox.style.setProperty("transition" , "opacity 0.2s ease-out, transform 0.2s ease-out")
    const infoBoxText = document.querySelector("#sundial-info-box-text")
    console.log("hovering over time replace element")
    infoBox.style.visibility = "visible";
    infoBox.style.opacity = "1";
    infoBoxText.innerHTML = `"${event.target.id}"`
    const element = event.target;
    const elementPosition = element.getBoundingClientRect();
    const infoBoxPosition = infoBox.getBoundingClientRect();
    const infoBoxTop = elementPosition.top - 5 - infoBoxPosition.height;
    const infoBoxLeft = elementPosition.left + elementPosition.width / 2 - infoBoxPosition.width / 2
    infoBox.style.top = infoBoxTop + "px"
    infoBox.style.left = infoBoxLeft + "px"

    infoBox.style.transform = "translate(0%, 0%)"
    infoBox.style.visibility = "visible"
    infoBox.style.opacity = "1"
}

function hideInfoBox(event){
    infoBox.style.visibility = "hidden";
    infoBox.style.opacity = "0";
    infoBox.style.transform = "translate(0%, 30%)"
}

function showOriginalTime(){
    const originalTime = document.querySelectorAll('.original-time');
    console.log("original times" + originalTime)
    console.log(`found ${originalTime.length} original times`)
    for(let time of originalTime){
        time.style.display = "";
    }
}

function hideOriginalTime(){
    const originalTime = document.querySelectorAll('.original-time');
    for(let time of originalTime){
        time.style.display = "none";
    }
}

function showReplacedTime(){
    console.log("showing replaced time")
    const replacedTime = document.querySelectorAll('.sundial-time-replace');
    console.log(`found ${replacedTime.length} replaced times`)
    for(let time of replacedTime){
        time.style.display = "";
    }
}

function hideReplacedTime(){
    console.log("hiding replaced time")
    const replacedTime = document.querySelectorAll('.sundial-time-replace');
    for(let time of replacedTime){
        time.style.display = "none";
    }
}
