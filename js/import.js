let importDiv = document.getElementById("import_div");
let importJsonStructureDiv = document.getElementById("import_json_structure_div");
let importButtonDiv = document.getElementById("import_button_div");

let validFile;

let form = document.querySelector('#upload');
let file = document.querySelector('#file');

form.addEventListener('submit', handleSubmit);

/**
 * Handle submit events
 * @param  {Event} event The event object
 */
function handleSubmit (event) {
	// Stop the form from reloading the page
	event.preventDefault();

	// If there's no file, do nothing
	if (!file.value.length) return;

	validFile = false;

	if (file.value.includes(ALL_DATA_EXPORT_FILE_NAME)) {
		validFile = true;
	}

	// Create a new FileReader() object
	let reader = new FileReader();

	// Set up the callback event to run when the file is read
	reader.onload = parseFile;

	// Read the file
	reader.readAsText(file.files[0]);
}

function parseFile (event) {
	importJsonStructureDiv.innerHTML = "";
	importButtonDiv.innerHTML = "";
	importDiv.style.display = "flex";

	if (validFile) {
		handleAllData(JSON.parse(event.target.result));
	}
}



// MAIN METHOD
function handleAllData(buckets) {
	buckets.forEach(function (bucket) {
		bucket["selected"] = false;
	});

	importJsonStructureDiv.appendChild(constructBucketsForAllData(buckets));

	let button = document.createElement('button');
	button.innerHTML = "IMPORT SELECTED DATA"
	button.addEventListener('click', async function () {
		if (confirm("Are you sure you want to import selected data in Runscope?")) {
			textArea.value = "";



			// MAIN LOOP
			for (let bucket of buckets) {
				let bucketKeyToUse = bucket.key;

				let sharedEnvironmentIdsArray = [];
				let testEnvironmentIdsArray = [];

				if (bucket.selected) {
					bucketKeyToUse = await handleBucketExistence(bucket);

					if (bucketKeyToUse == null) {
						return;
					}

					if (bucket["bucket_shared_environments"].length > 0) {

						// CREATE / UPDATE SHARED ENVIRONMENTS
						for (let sharedEnvironment of bucket.bucket_shared_environments) {
							let response = await handleSharedEnvironmentExistence(bucketKeyToUse, sharedEnvironment);
							if (response == null) {
								return;
							}

							let item = {};
							item["old_id"] = sharedEnvironment.id;
							item["new_id"] = response.data.id;

							sharedEnvironmentIdsArray.push(item);
						}
					}


					if (bucket["tests"].length > 0) {

						// CREATE OR UPDATE TESTS & TEST ENVIRONMENTS
						for (let test of bucket.tests) {

							let steps = test["steps"];
							test["steps"] = [];

							let schedules = test["schedules"];
							test["schedules"] = [];

							let testEnvironments = test["environments"];
							test["environments"] = [];


							// CREATE OR UPDATE TEST
							let testResponse = await handleTestExistence(bucketKeyToUse, test.id, test);
							if (testResponse == null) {
								return;
							}

							let newTest = testResponse.data;

							// CREATE OR UPDATE ALL TEST ENVIRONMENTS
							for (let testEnvironment of testEnvironments) {
								let response = await handleTestEnvironmentExistence(bucketKeyToUse, newTest.id, testEnvironment);
								if (response == null) {
									return;
								}

								let item = {};
								item["old_id"] = testEnvironment.id;
								item["new_id"] = response.data.id;

								testEnvironmentIdsArray.push(item);
							}

							// CONFIGURE TEST DEFAULT ENVIRONMENT AND UPDATE TEST TO HAVE IT
							if (!await configureDefaultEnvironment(sharedEnvironmentIdsArray, testEnvironmentIdsArray, bucketKeyToUse, test, newTest)) {
								return;
							}

							textArea.value = textArea.value + "\r\n\nconfiguring STEPS...";

							// CREATE OR UPDATE ALL TEST STEPS
							for (let step of steps) {
								if (await handleStepExistence(bucketKeyToUse, newTest["id"], step["id"], step) == null) {
									textArea.value = textArea.value + "\r\nconfiguring STEPS failed";
									return;
								}
							}

							textArea.value = textArea.value + "\r\nSTEPS configured successfully";

							let schedulesResponse = await getAllSchedules(bucketKeyToUse, newTest["id"]);
							if (schedulesResponse == null) {
								return;
							}

							let schedulesInRunscope = [];

							if (schedulesResponse.data.length > 0) {
								schedulesResponse.data.forEach(function (schedule) {
									schedulesInRunscope.push(schedule);
								});
							}

							// CREATE OR UPDATE ALL TEST SCHEDULES
							for (let schedule of schedules) {
								let newSchedule = await getConfiguredSchedule(sharedEnvironmentIdsArray, testEnvironmentIdsArray, schedule);

								if (schedulesInRunscope.length <= 0) {
									newSchedule["id"] = "";
								}

								if (await handleScheduleExistence(bucketKeyToUse, newTest["id"], newSchedule["id"], newSchedule) == null) {
									textArea.value = textArea.value + "\r\nconfiguring SCHEDULE failed";
									return;
								}
							}

						}
					}

					textArea.value = textArea.value + "\r\n\nAll operations completed.";
				}
			}
		}
	});

	importButtonDiv.appendChild(button);
}

async function handleBucketExistence(bucket) {
	let keyToReturn = bucket.key;

	try {
		if (await getBucketIfExists(bucket.key, false) == null) {
			textArea.value = textArea.value + "\r\n\nBUCKET '" + bucket.name + "' doesn't exist, creating it...";

			let url = "https://api.runscope.com/buckets?name=" + encodeURIComponent(bucket.name) + "&team_uuid=" + encodeURIComponent(bucket["team"]["id"]);

			let response = await createRequest(url, "POST", "", "BUCKET", true);
			if (response == null) {
				return null;
			}
			keyToReturn = response.data.key;
		}
	} catch (e) {
		textArea.value = textArea.value + "\r\n\n" + e;
		return null;
	}

	return keyToReturn;
}

async function handleSharedEnvironmentExistence(bucketKey, sharedEnvironment) {
	let response;

	try {
		// UPDATE
		if (await getSharedEnvironmentIfExists(bucketKey, sharedEnvironment.id, false) != null) {
			textArea.value = textArea.value + "\r\n\nSHARED ENVIRONMENT '" + sharedEnvironment.name + "' exists, updating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/environments/" + sharedEnvironment.id;
			response = await createRequest(url, "PUT", sharedEnvironment, "SHARED ENVIRONMENT", true);

			// CREATE
		} else {
			textArea.value = textArea.value + "\r\n\nSHARED ENVIRONMENT '" + sharedEnvironment.name + "' doesn't exist, creating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/environments";
			response = await createRequest(url, "POST", sharedEnvironment, "SHARED ENVIRONMENT", true);
		}
	} catch (e) {
		textArea.value = textArea.value + "\r\n\n" + e;
		return null;
	}

	return response;
}

async function handleTestExistence(bucketKey, testId, test) {
	let response;

	try {
		// UPDATE
		if (await getTestDetailsIfExists(bucketKey, testId, false) != null) {
			textArea.value = textArea.value + "\r\n\nTEST '" + test.name + "' exists, updating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/tests/" + testId;
			response = await createRequest(url, "PUT", test, "TEST", true);

			// CREATE
		} else {
			textArea.value = textArea.value + "\r\n\nTEST '" + test.name + "' doesn't exist, creating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/tests";
			response = await createRequest(url, "POST", test, "TEST", true);
		}
	} catch (e) {
		textArea.value = textArea.value + "\r\n\n" + e;
		return null;
	}


	return response;
}

async function handleTestEnvironmentExistence(bucketKey, testId, testEnvironment) {
	let response;

	try {
		// UPDATE
		if (await getTestEnvironmentIfExists(bucketKey, testId, testEnvironment.id, false) != null) {
			textArea.value = textArea.value + "\r\n\nTEST ENVIRONMENT '" + testEnvironment.name + "' exists, updating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/tests/" + testId + "/environments/" + testEnvironment.id;
			response = await createRequest(url, "PUT", testEnvironment, "TEST ENVIRONMENT", true);

			// CREATE
		} else {
			textArea.value = textArea.value + "\r\n\nTEST ENVIRONMENT '" + testEnvironment.name + "' doesn't exist, creating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/tests/" + testId + "/environments";
			response = await createRequest(url, "POST", testEnvironment, "TEST ENVIRONMENT", true);
		}
	} catch (e) {
		textArea.value = textArea.value + "\r\n\n" + e;
		return null;
	}

	return response;
}

async function handleStepExistence(bucketKey, testId, stepId, step) {
	let response;

	try {
		// UPDATE
		if (await getStepIfExists(bucketKey, testId, stepId, false) != null) {
			// textArea.value = textArea.value + "\r\n\nSTEP exists, updating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/tests/" + testId + "/steps/" + stepId;
			response = await createRequest(url, "PUT", step, "STEP", false);

			// CREATE
		} else {
			// textArea.value = textArea.value + "\r\n\nSTEP doesn't exist, creating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/tests/" + testId + "/steps";
			response = await createRequest(url, "POST", step, "STEP", false);
		}
	} catch (e) {
		textArea.value = textArea.value + "\r\n\n" + e;
		return null;
	}


	return response;
}

async function handleScheduleExistence(bucketKey, testId, scheduleId, schedule) {
	let response;

	try {
		if (scheduleId.length <= 0) {
			textArea.value = textArea.value + "\r\n\nSCHEDULE doesn't exist, creating it...";

			let url = "https://api.runscope.com/v1/buckets/" + bucketKey + "/tests/" + testId + "/schedules";
			response = await createRequest(url, "POST", schedule, "SCHEDULE", true);
		} else {
			textArea.value = textArea.value + "\r\n\nSCHEDULE exists, updating it...";

			let url = "https://api.runscope.com/buckets/" + bucketKey + "/tests/" + testId + "/schedules/" + scheduleId;
			response = await createRequest(url, "PUT", schedule, "SCHEDULE", true);
		}
	} catch (e) {
		textArea.value = textArea.value + "\r\n\n" + e;
		return null;
	}

	return response;
}



async function getConfiguredSchedule(sharedEnvironmentIdsArray, testEnvironmentIdsArray, schedule) {

	let found = false;
	for (let sharedEnvironmentItem of sharedEnvironmentIdsArray) {
		if (schedule["environment_id"] === sharedEnvironmentItem.old_id) {
			schedule["environment_id"] = sharedEnvironmentItem.new_id;
			found = true;
			break;
		}
	}

	if (!found) {
		for (let testEnvironmentItem of testEnvironmentIdsArray) {
			if (schedule["environment_id"] === testEnvironmentItem.old_id) {
				schedule["environment_id"] = testEnvironmentItem.new_id;
				found = true;
				break;
			}
		}
	}

	return schedule;
}

async function configureDefaultEnvironment(sharedEnvironmentIdsArray, testEnvironmentIdsArray, bucketKeyToUse, oldTest, newTest) {

	// CHECK IF TEST'S DEFAULT ENVIRONMENT WAS SHARED ENVIRONMENT
	let found = false;
	for (let sharedEnvironmentItem of sharedEnvironmentIdsArray) {
		if (oldTest["default_environment_id"] === sharedEnvironmentItem.old_id) {
			newTest["default_environment_id"] = sharedEnvironmentItem.new_id;
			found = true;
			break;
		}
	}

	// CHECK IF TEST'S DEFAULT ENVIRONMENT WAS TEST ENVIRONMENT
	if (!found) {
		for (let testEnvironmentItem of testEnvironmentIdsArray) {
			if (oldTest["default_environment_id"] === testEnvironmentItem.old_id) {
				newTest["default_environment_id"] = testEnvironmentItem.new_id;
				found = true;
				break;
			}
		}
	}

	// UPDATE TEST TO HAVE CORRECT DEFAULT_ENVIRONMENT_ID
	if (found) {
		if (await handleTestExistence(bucketKeyToUse, newTest.id, newTest) == null) {
			return false;
		}
	}

	return true;
}
