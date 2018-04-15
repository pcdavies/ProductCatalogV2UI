/* Javascript .js file for the alpha.html page */

/*********************************************************
CHANGE THE URLS BELOW FOR THE WORKSHOP - THESE URLS MUST POINT TO THE MICROSERVICES.      
*********************************************************/

// URL for the MySQL database REST service
var dbServiceURL = "https://notactivated";

// URL for the Twitter REST service
var tweetServiceBaseURL = "https://notactivated";

/*********************************************************
CHANGE THE URLS ABOVE FOR THE WORKSHOP.    
*********************************************************/

// Set position and size variables.
var popupTopVar = 20;
var popupTwitterContentHeightVar = 490;

// Set constants used in animation.
var transitionCurveVar = 1.05;
var transitionPositionStepsVar = 30;
var transitionSizeStepsVar = 10;
var widthIncrementVar = 30;
var heightIncrementVar = 30;

// Some browsers (e.g. Chrome) process animations faster than others - set some browsers slower and some faster.
var browserTransitionIntervalArray = new Array();
browserTransitionIntervalArray["Firefox"] = 7;
browserTransitionIntervalArray["IE"] = 2;
browserTransitionIntervalArray["Chrome"] = 11;
browserTransitionIntervalArray["Safari"] = 7;
var transitionIntervalVar = browserTransitionIntervalArray[getBrowser()];

// Holds json for future calls to manipulate data
var holder = null;
// Other global variables and arrays
var productArray = new Array();
var productIndexArray = new Array();
var popupHTLMArray;
var indexVar;
var twitterDataLoadedVar;
var transitionCompletedVar;
var hashtagVar;
var tweetTableTemplateVar;

$(document).ready(function () {
    // If the dbServiceURL has not been changed ...
    if (dbServiceURL == "https://notactivated") {
        document.getElementById("productDiv").innerHTML = document.getElementById("noMySQLRESTURLFillerDiv").innerHTML;
        return;
    }
    // Call REST service Node.js accessing MySQL product data.
    $.getJSON(dbServiceURL, function (data) {
        try{
            holder =data;
            buildHTML();
        }
        catch(err){
            console.log("Error retrieving the Product data from the JSON Endpoint.");
        }
    });

// Build HTML from the JSON Feed.
    // Create a template for the product panels.  There are 4 product panels per row on the main page.  In order have the popup panel used in the animation look identical to the 
    // product panels, the product panel template is extracted from the popup panel.  The template is contained in popupHTLMArray[0] and popupHTLMArray[1].
    // The generic template is created by removing syntax specific to the popup panel.
    function buildHTML() { 
        var i;  
        var j; 
        tweetTableTemplateVar = document.getElementById("tweetTableFillerDiv").innerHTML; // To be used later for formatting Tweet data in the popup
        popupHTLMArray = document.getElementById("popupTable").innerHTML.split("~");
        popupHTLMArray[0] = popupHTLMArray[0].replace(" id=\"popupProductC4R1Spacer\"", "");
        popupHTLMArray[0] = popupHTLMArray[0].replace(" id=\"popupProductContentDiv\"", "");
        popupHTLMArray[1] = popupHTLMArray[1].replace(" id=\"popupTwitterContentTd\"", "");
        popupHTLMArray[1] = popupHTLMArray[1].replace(" id=\"popupProductC1R3Spacer\"", "");
        popupHTLMArray[1] = popupHTLMArray[1].replace(" id=\"popupControlTd\"", "");
        indexVar = 0;
        try {
        //Loop through JSON and populate productArray.
        $.each(holder.Products, function(index, details) { 
            productArray[details.PRODUCT_ID] = {parent_category_id: details.PARENT_CATEGORY_ID, category_id: details.CATEGORY_ID,
                product_name: details.PRODUCT_NAME, product_status: details.PRODUCT_STATUS, list_price: details.LIST_PRICE,
                warranty_period_months: details.WARRANTY_PERIOD_MONTHS, external_url: details.EXTERNAL_URL, hashtag: details.TWITTER_TAG};                                                                              
            productIndexArray[indexVar] = details.PRODUCT_ID;             
            indexVar = indexVar + 1;                   
        });
        // Create table HTML from productArray.
        var columnNumberConst = 4;
        var tableVar = "<table id=\"allTable\" style=\"border-spacing:0px\">";
        for (i = 0; i < productIndexArray.length; i++) {
            if (i % columnNumberConst == 0) {
                tableVar = tableVar + "<tr>";
            }
            tableVar = tableVar + "<td class=\"productTd\"><table id=\"PROD" + productIndexArray[i] + "\" onclick=\"selectProduct(" +
                productIndexArray[i] + ")\" class=\"popupTable\">" + popupHTLMArray[0] +            
                innerProductPanelHTML(productIndexArray[i]) +             
                popupHTLMArray[1] + "</table></td>";                            
            if (i == (productIndexArray.length - 1)) {
                for (j = 0; j < (columnNumberConst - i % columnNumberConst - 1); j++) {
                    tableVar = tableVar + "<td>&nbsp;</td>";
                }
                tableVar = tableVar + "</tr>";
            } else if (i % columnNumberConst == (columnNumberConst - 1)) {
                tableVar = tableVar + "</tr>";
            }
        }        
        tableVar = tableVar.replace(/\(R\)/g, "&reg;");       
        tableVar = tableVar.replace(/[^\x00-\x7F]/g, "");                      
        tableVar = tableVar + "</table>";           
        // Write table HTML to productDiv.
        document.getElementById("productDiv").innerHTML = tableVar;
        }
        catch(err){
            console.log("Error parsing the data in the JSON file");
        }
    }
});

function innerProductPanelHTML(indexParm) {
    var htmlVar = "<img src=\"" + productArray[indexParm].external_url +
            "\" class=\"productImage\"><div class=\"productNameDiv\">" + productArray[indexParm].product_name + "</div>Price: $" + 
            diplayPrice(productArray[indexParm].list_price) +  ""
    return htmlVar;
}

function diplayPrice(priceParm) {
    stringVar = Math.round(priceParm * 100).toString();
    stringVar = stringVar.substr(0, (stringVar.length - 2)) + "." + stringVar.substr(stringVar.length - 2);
    return stringVar;
}

// Start animation on click of a product panel.
function selectProduct(idParm) {  
    // Prevent selecting a second product while first product is still open.
    if (lockVar) {
        return;
    }  
    // If Twitter REST service URL has not been updated 
    if (tweetServiceBaseURL == "https://notactivated") {
        alert("You have not yet replaced the URL for the Twitter REST service with the appropriate one for your deployment environment.");
        return;
    }
    lockVar = true;
    hashtagVar = productArray[idParm].hashtag;
    twitterDataLoadedVar = false;
    transitionCompletedVar = false;    
    getTwitter(hashtagVar);
    popupObjVar = document.getElementById("popupTable");
    document.getElementById("popupProductContentDiv").innerHTML = innerProductPanelHTML(idParm);  
    selectedObjVar = document.getElementById("PROD" + idParm);
    var offsetVar = getOffset(selectedObjVar);
    popupObjVar.style.visibility = "visible";
    popupObjVar.style.top = offsetVar.top + "px";
    popupObjVar.style.left = offsetVar.left + "px";
    startTopVar = offsetVar.top;
    startLeftVar = offsetVar.left;    
    endTopVar = popupTopVar + $(document).scrollTop();
    endLeftVar = ($('body').innerWidth() - popupObjVar.offsetWidth)/2 + $(document).scrollLeft();    
    selectedObjVar.style.visibility = "hidden"; 
    modeVar = "EXPAND";
    startTransitionPosition();
}

/////////////////////////////////////////////////////////////////////
// POPUP ANIMATIONS
/////////////////////////////////////////////////////////////////////

var incrementFactorArray = new Array();
var incrementFactorSumVar = 2;
incrementFactorArray[0] = 2
// Calculate curved path for popup animation (done once on initial load).
var z;
for (z = 1; z < transitionPositionStepsVar; z++) {
    incrementFactorArray[z] = Math.pow(incrementFactorArray[(z - 1)], transitionCurveVar);
    incrementFactorSumVar = incrementFactorSumVar + incrementFactorArray[z];
}
var transitionIndexVar;
var currentTopVar;
var currentLeftVar;
var currentWidthVar = 1;
var currentHeightVar = 1;
var endTopVar;
var endLeftVar;
var startTopVar;
var startLeftVar; 
var popupObjVar;
var selectedObjVar;
var totalVerticalVar;
var totalHorizontalVar;
var modeVar;
var lockVar = false;

function startTransitionPosition() {
    if (modeVar == "EXPAND") {
        currentTopVar = startTopVar; 
        currentLeftVar = startLeftVar;       
        totalVerticalVar = endTopVar - currentTopVar;
        totalHorizontalVar = endLeftVar - currentLeftVar;    
    }
    else {
        totalVerticalVar = startTopVar - currentTopVar;
        totalHorizontalVar = startLeftVar - currentLeftVar;       
    }
    transitionIndexVar = 0;
    transitionPosition();
}

// Loop through transition position by setting timeouts.
function transitionPosition() {
    popupObjVar.style.top = currentTopVar + "px";
    popupObjVar.style.left = currentLeftVar + "px";   
    if (transitionIndexVar < transitionPositionStepsVar) {    
        currentTopVar = currentTopVar + (totalVerticalVar * (incrementFactorArray[transitionIndexVar]/incrementFactorSumVar));
        currentLeftVar = currentLeftVar + (totalHorizontalVar * (incrementFactorArray[(transitionPositionStepsVar - transitionIndexVar - 1)]/incrementFactorSumVar));
        transitionIndexVar = transitionIndexVar + 1; 
        setTimeout(function(){ transitionPosition(); }, transitionIntervalVar);
    }
    else {
        if (modeVar == "EXPAND") {
            popupObjVar.style.top = endTopVar + "px";
            popupObjVar.style.left = endLeftVar + "px";    
            transitionIndexVar = 0;
            transitionSize();
        }
        else {     
            selectedObjVar.style.visibility = "visible"; 
            popupObjVar.style.visibility = "hidden";
            document.getElementById("popupProductContentDiv").innerHTML = "";
            lockVar = false;
        }           
    }  
}

// Loop through transition size by setting timeouts.
function transitionSize() {
    document.getElementById("popupProductC4R1Spacer").style.width = currentWidthVar + "px";
    document.getElementById("popupProductC1R3Spacer").style.height = currentHeightVar + "px";    
    popupObjVar.style.left = currentLeftVar + "px";    
    if (transitionIndexVar < transitionSizeStepsVar) {
        currentLeftVar = currentLeftVar - widthIncrementVar;
        currentWidthVar = currentWidthVar + (2 * widthIncrementVar);
        currentHeightVar = Math.min((currentHeightVar + heightIncrementVar), (popupTwitterContentHeightVar - document.getElementById("popupProductContentDiv").offsetHeight));               
        transitionIndexVar = transitionIndexVar + 1; 
        setTimeout(function(){ transitionSize(); }, transitionIntervalVar);
    }
    else {
        document.getElementById("popupTwitterContentTd").innerHTML = "<table style=\"width:100%\"><td style=\"width:100%\"><div id=\"popupTwitterContentDiv\">" +
        "</div></td><td><img src=\"Images/spacer.png\" style=\"width:10px;visibility:hidden;\" /></td></table>";  
        document.getElementById("popupTwitterContentDiv").style.height = popupTwitterContentHeightVar + "px"; 
        document.getElementById("popupControlTd").innerHTML = document.getElementById("popupControlTdFillerDiv").innerHTML;  
        transitionCompletedVar = true; 
        if (twitterDataLoadedVar) {  
            buildTwitterHTML("1");
        }   
    }
}

function hidePopup() {
    document.getElementById("popupTwitterContentTd").innerHTML = "";
    document.getElementById("popupControlTd").innerHTML = "";
    document.getElementById("popupProductC4R1Spacer").style.width = "0px";
    document.getElementById("popupProductC1R3Spacer").style.height = "0px";    
    currentWidthVar = 1;
    currentHeightVar = 1;  
    popupObjVar.style.left = endLeftVar + "px";
    currentLeftVar = endLeftVar;
    modeVar = "CONTRACT";
    startTransitionPosition();
}    

// Get position of original panel to be animated.
function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft; // - el.scrollLeft;
        _y += el.offsetTop; // - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

/////////////////////////////////////////////////////////////////////
// GET TWITTER JSON AND PARSE
/////////////////////////////////////////////////////////////////////

var twitterArray;

// Call REST service Java code extracting appropriate records from the Twitter JSON file based on harshtagParm.  The "/%23" adds a "#" to the beginning of the hashtag search string.
function getTwitter(harshtagParm) {
    twitterArray = new Array();
    $.getJSON(tweetServiceBaseURL + "/%23" + harshtagParm, function (data) {
        try{
            holder =data;
            buildTwitterArray();
        }
        catch(err){
            console.log("Error retrieving the Product data from the JSON Endpoint.")
        }
    });
      
    var monthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var ampmArray = ["AM", "PM"];
    
    function buildTwitterArray() { 
        indexVar = 0;
        // Loop through all the JSON Twitter records returned by the Twitter REST service
        $.each(holder.tweets, function(index, details) {       
            if (details.text) { 
                var dateSortString = details.timestamp_ms;                               
                var theDate = new Date(parseInt(details.timestamp_ms)); 
                var month = monthArray[theDate.getMonth()];                  
                var hour = theDate.getHours(); if((hour<7)&&(theDate.getMinutes()<50)){hour=hour+9;dateSortString=(dateSortString*1)+32400000;}                
                var ampmVar = ampmArray[Math.floor(hour/12)]; 
                hour = hour%12; if (hour == 0) {hour = 12;}                     
                var minute = "0" + theDate.getMinutes(); minute = minute.substr(-2);        
                var dateString = hour + ":" + minute + " " + ampmVar + " - " + month + " " +
                    theDate.getDate() + ", " + theDate.getFullYear(); 
                 var iVar = details.id_str;var rpVar=iVar.charAt(2)%3;var rtVar=iVar.charAt(4)%2;var lVar=iVar.charAt(6)%5;
                    if(rpVar==0){rpVar=" ";}if(rtVar==0){rtVar=" ";}if(lVar==0){lVar=" ";}
                // Load the twitterArray with data from the Twitter REST service.  Also create a starting value for the tweetHTML string based on a previously loaded tweetTableTemplateVar.                                 
                twitterArray[indexVar] = {screenName: details.user.screen_name.trim(), name: details.user.name.trim(),  tweetText: formatTweetText(details.text), 
                     tweetTimestamp: dateSortString, tweetDate: dateString, id_str: details.id_str, tweetHTML: tweetTableTemplateVar};  
                // Replace placeholders in the tweetHTML string with specific values for the Tweet record.                        
                twitterArray[indexVar].tweetHTML =  twitterArray[indexVar].tweetHTML.replace("~NAME~", twitterArray[indexVar].name);  
                twitterArray[indexVar].tweetHTML =  twitterArray[indexVar].tweetHTML.replace("~SCREENNAME~", "<a href=\"https://twitter.com/" +
                    twitterArray[indexVar].screenName + "\" class=\"tweetScreennameLink\" target=\"_blank\" >@" + twitterArray[indexVar].screenName + "</a>");
                twitterArray[indexVar].tweetHTML =  twitterArray[indexVar].tweetHTML.replace("~FOLLOWSCREENNAME~", twitterArray[indexVar].screenName);                   
                twitterArray[indexVar].tweetHTML =  twitterArray[indexVar].tweetHTML.replace("~TEXT~", twitterArray[indexVar].tweetText);     
                twitterArray[indexVar].tweetHTML =  twitterArray[indexVar].tweetHTML.replace("~DATE~", twitterArray[indexVar].tweetDate);               
                twitterArray[indexVar].tweetHTML =  twitterArray[indexVar].tweetHTML.replace("~REPLIES~", "<input type=\"text\" readonly value=\"" + rpVar + "\" />"); 
                twitterArray[indexVar].tweetHTML =  twitterArray[indexVar].tweetHTML.replace("~RETWEETS~", "<input type=\"text\" readonly value=\"" + rtVar + "\" />"); 
                twitterArray[indexVar].tweetHTML =  twitterArray[indexVar].tweetHTML.replace("~LIKES~", "<input type=\"text\" readonly value=\"" + lVar + "\" />");                                                     
                indexVar = indexVar + 1;                                            
            }                                              
        });            
        twitterDataLoadedVar = true; 
        if (transitionCompletedVar) {  
            buildTwitterHTML("1");
        }    
    }    
}

// Create the Tweet table HTML based on the tweetHTML strings.  Sort this array and then create the final Tweet table HTML.
function buildTwitterHTML(sortParm) {
    var i;   
    var sortHiddenStringVar;        
    var tweetSortArray = new Array();  
    var tweetString = "";          
    for (i = 0; i < twitterArray.length; i++) {  
        if (sortParm == 1) {sortHiddenStringVar = twitterArray[i].screenName.toUpperCase();}
        if (sortParm == 2) {sortHiddenStringVar = twitterArray[i].tweetText.toUpperCase();}
        if (sortParm == 3) {sortHiddenStringVar = twitterArray[i].tweetTimestamp;}           
        tweetSortArray[i] = sortHiddenStringVar + "^*^" +  twitterArray[i].tweetHTML;
    }
    tweetSortArray.sort(); 
    for (i = 0; i < twitterArray.length; i++) {                          
        tweetString = tweetString + tweetSortArray[i].substr(tweetSortArray[i].indexOf('^*^') + 3);  
    }
    tweetString = tweetString + "<br /><br />";        
    document.getElementById("popupTwitterContentDiv").innerHTML = tweetString;        
    document.getElementById("popupTwitterContentDiv").scrollTo(0, 0);                
    document.getElementById("tweetNumberLabel").innerHTML = indexVar + " Tweets Total";
}

// Format the raw tweet text.
function formatTweetText(stringParm) { 
    var j;
    var tweetVar = "  " + stringParm + "  "; 
    var locationVar;
    var linkTextVar = "";
    var hrefVar;
    var tweetFirstArray;
    var tweetSecondArray = new Array();
    function secondArrayObj () {
        var linkString = "";
        var textString = "";
    }    
    tweetVar = tweetVar.replace(/ï¿½/g, "'");
    tweetVar = tweetVar.replace(/ï¿½H1/g, '');    
    tweetVar = tweetVar.replace(/ï¿½H2/g, ''); 
    tweetVar = tweetVar.replace(/ï¿½H3/g, '');     
    tweetVar = tweetVar.replace(/ï¿½S1/g, '');     
    tweetVar = tweetVar.replace(/ï¿½S2/g, '');        
    tweetVar = tweetVar.replace(/ï¿½S3/g, '');    
    tweetVar = tweetVar.replace(/#/g, '^^#');
    tweetVar = tweetVar.replace(/@/g, '^^@');
    tweetVar = tweetVar.replace(/http:\/\//g, '^^http://');
    tweetVar = tweetVar.replace(/https:\/\//g, '^^https://');
    tweetFirstArray = tweetVar.split("^^");
    for (j = 1; j < tweetFirstArray.length; j++) {
        tweetSecondArray[j] = new secondArrayObj;
        locationVar = tweetFirstArray[j].indexOf(' ');
        tweetSecondArray[j].linkString = tweetFirstArray[j].substr(0, locationVar);
        tweetSecondArray[j].textString = tweetFirstArray[j].substr(locationVar);
        if ((tweetSecondArray[j].linkString.slice(-1) == ".")||(tweetSecondArray[j].linkString.slice(-1) == "?")||(tweetSecondArray[j].linkString.slice(-1) == "!")||
            (tweetSecondArray[j].linkString.slice(-1) == ",")||(tweetSecondArray[j].linkString.slice(-1) == ")")) {
            tweetSecondArray[j].textString = tweetSecondArray[j].linkString.slice(-1) + tweetSecondArray[j].textString; 
            tweetSecondArray[j].linkString = tweetSecondArray[j].linkString.substr(0, (tweetSecondArray[j].linkString.length - 1));
        }
        if (tweetSecondArray[j].linkString.charAt(0) == "#") {
            linkTextVar = tweetSecondArray[j].linkString;
            hrefVar = "https://twitter.com/hashtag/" + linkTextVar.substr(1) + "?src=hash";
        }
        else if (tweetSecondArray[j].linkString.charAt(0) == "@") {
            linkTextVar = tweetSecondArray[j].linkString;
            hrefVar = "https://twitter.com/" + linkTextVar.substr(1);
        }
        else if (tweetSecondArray[j].linkString.substr(0, 11) == "http://www.") {
            hrefVar = tweetSecondArray[j].linkString;
            linkTextVar = hrefVar.substr(11, 23);        
        }
        else if (tweetSecondArray[j].linkString.substr(0, 12) == "https://www.") {
            hrefVar = tweetSecondArray[j].linkString;
            linkTextVar = hrefVar.substr(12, 23);        
        }
        else if (tweetSecondArray[j].linkString.substr(0, 7) == "http://") {
            hrefVar = tweetSecondArray[j].linkString;
            linkTextVar = hrefVar.substr(7, 23);        
        }
        else if (tweetSecondArray[j].linkString.substr(0, 8) == "https://") {
            hrefVar = tweetSecondArray[j].linkString;
            linkTextVar = hrefVar.substr(8, 23);        
        }
        if (linkTextVar != "") {
            tweetSecondArray[j].linkString = "<a href=\"" + hrefVar + "\" target=\"_blank\">" + linkTextVar + "</a>";
        }
    }
    tweetVar = tweetFirstArray[0];
    for (j = 1; j < tweetSecondArray.length; j++) {
        tweetVar = tweetVar + tweetSecondArray[j].linkString +  tweetSecondArray[j].textString; 
    }
    return tweetVar.trim();
}

function getBrowser(){
    var ua= navigator.userAgent, tem, 
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];    
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE';
    }
    else {
        if(M[1]=== 'Chrome'){
            tem= ua.match(/\b(OPR|Edge)\/(\d+)/);        
        }
        M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
        if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);  
        return M[0];
    }    
}
