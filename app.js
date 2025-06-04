//Load elements from HTML
followup = document.getElementById('followup');
recent = document.getElementById('recent');
offer = document.getElementById('offer');
deny = document.getElementById('deny');
enter_days = document.getElementById('enter_days');

//Have the page reload when the enter key is pressed to reorganize the applications
document.addEventListener('keydown', (event) => {
    if (event.key == 'Enter') {
        location.reload();
    }
});

//Load the last value used in to categorize applications as requiring followups
if (localStorage.getItem("days") != null){
    enter_days.value = localStorage.getItem("days");
}
else {
    enter_days.value = "30";
}

//Load the job applications
var mydata = JSON.parse(data);
sort_dates();
load_applications();

//Store the number of days to categorize entries as needing followup
enter_days.addEventListener('input', (event) => {
  localStorage.setItem("days", enter_days.value);
});

function load_applications() {
    //for each job application
    for (i=0; i < mydata.length; i+=1) {
        //convert the date in the json file to a date object
        const d = new Date(mydata[i].DateUpdated);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        //create the link for the job application and calculate the number of days since it was last updated
        var card = document.createElement('a');
        let now = new Date();
        if (mydata[i].Company == "Example1") { //exclude the example
            //Do Nothing
        }
        else if (mydata[i].Denied == "Yes") { //categorize as denial and format
            card.innerHTML = '<div class="application_card" style="background-color:#ff00008a;"><h1>' + mydata[i].JobTitle + '</h1>\
                <h2>' + mydata[i].Company + '-' + mydata[i].Location + '</h2>\
                <h3>Date Updated: ' + d.toLocaleString('en-us', options) + '</h3></div>';
            card.href = 'Job Application Markdowns/' + mydata[i].ID + '.md';
            card.target = '_blank';
            deny.appendChild(card);
        }
        else if (mydata[i].Offered == "Yes") { //categorize as offer and format
            card.innerHTML = '<div class="application_card" style="background-color:#03620093;"><h1>' + mydata[i].JobTitle + '</h1>\
                <h2>' + mydata[i].Company + '-' + mydata[i].Location + '</h2>\
                <h3>Date Updated: ' + d.toLocaleString('en-us', options) + '</h3></div>';
            card.href = 'Job Application Markdowns/' + mydata[i].ID + '.md';
            card.target = '_blank';
            offer.appendChild(card);
        }
        else if (((now - d) / (1000 * 3600 * 24)) >= parseInt(enter_days.value)) { //categorize as followup and format
            card.href = 'Job Application Markdowns/' + mydata[i].ID + '.md';
            card.target = '_blank';
            if (mydata[i].Interviewed == "Yes") {
                card.innerHTML = '<div class="application_card" style="background-color:#8158008a;"><h1>' + mydata[i].JobTitle + '</h1>\
                    <h2>' + mydata[i].Company + '-' + mydata[i].Location + '</h2>\
                    <h3>Date Updated: ' + d.toLocaleString('en-us', options) + '</h3>\
                    <p>Previous Followup: ' + mydata[i].PreviousFollowup + '</p></div>';
            }
            else {
                card.innerHTML = '<div class="application_card" style="background-color:#7b81008a;"><h1>' + mydata[i].JobTitle + '</h1>\
                    <h2>' + mydata[i].Company + '-' + mydata[i].Location + '</h2>\
                    <h3>Date Updated: ' + d.toLocaleString('en-us', options) + '</h3>\
                    <p>Previous Followup: ' + mydata[i].PreviousFollowup + '</p></div>';
            }
            followup.appendChild(card);
        }
        else { //categorize as no action and format
            if (mydata[i].Interviewed == "Yes") {
                card.innerHTML = '<div class="application_card" style="background-color:#70f0708a;"><h1>' + mydata[i].JobTitle + '</h1>\
                    <h2>' + mydata[i].Company + '-' + mydata[i].Location + '</h2>\
                    <h3>Date Updated: ' + d.toLocaleString('en-us', options) + '</h3></div>';
            }
            else {
                card.innerHTML = '<div class="application_card" style="background-color:#ffffff8a;"><h1>' + mydata[i].JobTitle + '</h1>\
                    <h2>' + mydata[i].Company + '-' + mydata[i].Location + '</h2>\
                    <h3>Date Updated: ' + d.toLocaleString('en-us', options) + '</h3></div>';
            }
            card.href = 'Job Application Markdowns/' + mydata[i].ID + '.md';
            card.target = '_blank';
            card.style.color = 'black';
            recent.appendChild(card);
        }
    }
}

//function to sort the applications by the date they were last updated
function sort_dates() {
    var sorted = false;
    while (!sorted) {
        sorted = true;
        for (i=0; i < mydata.length-1; i+=1) {
            if (mydata[i].DateUpdated > mydata[i+1].DateUpdated) {
                var temp = mydata[i];
                mydata[i] = mydata[i+1];
                mydata[i+1] = temp;
                sorted = false;
            }
        }
    }
}