const textArea = document.getElementById("textArea");
const runscopeSelect = document.getElementById("runscope_options");
const runscopeBucketIdInput = document.getElementById("runscope_bucket_id_input");
const runscopeTestIdInput = document.getElementById("runscope_test_id_input");


const ALL_DATA_EXPORT_FILE_NAME = "all_data_export_"
const BUCKETS_EXPORT_FILE_NAME = "buckets_export_"
const SHARED_ENVIRONMENTS_EXPORT_FILE_NAME = "shared_environments_export_"
const TEST_DETAILS_EXPORT_FILE_NAME = "test_details_export_"


// UI ACCORDION CONTROLS
let acc = document.getElementsByClassName("accordion");
for (let i = 0; i < acc.length; i++) {
	acc[i].addEventListener("click", function() {
		/* Toggle between adding and removing the "active" class,
        to highlight the button that controls the panel */
		this.classList.toggle("active");

		/* Toggle between hiding and showing the active panel */
		let panel = this.nextElementSibling;
		if (panel.style.display === "flex") {
			panel.style.display = "none";
		} else {
			panel.style.display = "flex";
		}
	});
}



async function createRequest(url, method, jsonData, entity, showSuccessMessage, showNotFoundErrorMessage) {
	let response = await sendRequest(url, method, jsonData);

	if (response === undefined || response == null) {
		textArea.value = textArea.value + "\r\n\n" + entity + " " + method + " failed";
		return null;
	}

	let error = JSON.stringify(response.error);

	if (error !== 'null') {
		if (showNotFoundErrorMessage) {
			textArea.value = textArea.value + "\r\n\n" + entity + " " + method + " failed, reason: \r\n" + error;
		}
		return null;
	}

	if (showSuccessMessage)
		textArea.value = textArea.value + "\r\n" + entity + " " + method + " successful";

	return response;
}

async function sendRequest(url, method, jsonData) {
	let error = false;

	let headers = {};
	headers["Content-Type"] = "application/json";
	headers["Authorization"] = "Bearer " + getApiKey();

	let init = {};
	init["method"] = method;
	init["headers"] = headers;

	if (method !== "GET") {
		init["body"] = JSON.stringify(jsonData);
	}

	let response = await fetch(url, init)
		.catch(function (e) {
			textArea.value = textArea.value + "\r\n\n" + e;
			error = true;
		});


	return error ? null : response.json();
}


// CREATE JSON FILE AND DOWNLOAD IT
function download(content, fileName, contentType) {
	const a = document.createElement("a");
	const file = new Blob([content], { type: contentType });
	a.href = URL.createObjectURL(file);
	a.download = fileName;
	a.click();
}

function getCurrentTimestamp() {
	let today = new Date();
	return today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '_' + today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
}

// CURRENTLY DEPENDANT ON UI
function getApiKey() {
	if (document.getElementById("runscope_api_key_input").value.length <= 0) {
		alert("API KEY IS REQUIRED")
		return false;
	}

	return document.getElementById("runscope_api_key_input").value;
}
