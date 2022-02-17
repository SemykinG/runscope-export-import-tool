// UNNECESSARY
async function getDetails() {
	let entity = "";
	let url;
	let getUrl = () => {
		if (runscopeSelect.value.length <= 0) {
			alert("RUNSCOPE AREA is required")
			return null;
		}

		switch(runscopeSelect.value) {
			case "ACCOUNT_TEAMS":
				url = "https://api.runscope.com/account"
				entity = "ACCOUNT";
				break;

			case "BUCKETS":
				if (runscopeBucketIdInput.value.length <= 0) {
					url = "https://api.runscope.com/buckets";
				} else {
					url = "https://api.runscope.com/v1/buckets/" + runscopeBucketIdInput.value
				}
				entity = "BUCKETS";
				break;

			case "TEST_DETAILS":
				if (runscopeBucketIdInput.value.length <= 0) {
					alert("BUCKET KEY is required")
					return null;
				}

				if (runscopeTestIdInput.value.length <= 0) {
					alert("TEST ID is required")
					return null;
				}

				url = "https://api.runscope.com/buckets/" + runscopeBucketIdInput.value + "/tests/" + runscopeTestIdInput.value
				entity = "TEST DETAILS";
				break;

			case "TESTS":
				if (runscopeBucketIdInput.value.length <= 0) {
					alert("BUCKET KEY is required")
					return null;
				}

				url = "https://api.runscope.com/buckets/" + runscopeBucketIdInput.value + "/tests"
				entity = "TESTS";
				break;

			case "SHARED_ENVIRONMENTS":
				if (runscopeBucketIdInput.value.length <= 0) {
					alert("BUCKET KEY is required")
					return null;
				}

				url = "https://api.runscope.com/buckets/" + runscopeBucketIdInput.value + "/environments"
				entity = "SHARED ENVIRONMENTS";
				break;

			case "TEST_ENVIRONMENTS":
				if (runscopeBucketIdInput.value.length <= 0) {
					alert("BUCKET KEY is required")
					return null;
				}

				if (runscopeTestIdInput.value.length <= 0) {
					alert("TEST ID is required")
					return null;
				}

				url = "https://api.runscope.com/buckets/" + runscopeBucketIdInput.value + "/tests/" + runscopeTestIdInput.value + "/environments"
				entity = "TEST ENVIRONMENTS";
				break;
		}

		return url;
	};

	url = getUrl();
	if (url != null) {
		let response = await createRequest(url, "GET", "", entity);
		if (response != null) {
			textArea.value = JSON.stringify(response, null, 4);
		}
	}
}



async function getAllBuckets() {
	let url = "https://api.runscope.com/buckets";
	return createRequest(url, "GET", "", "ALL BUCKETS", false);
}

async function getAllSharedEnvironments(bucketKey) {
	if (bucketKey === undefined || bucketKey.length <= 0) {
		return null;
	}

	let url = 'https://api.runscope.com/buckets/' + bucketKey + '/environments';
	return createRequest(url, "GET", "", "ALL SHARED ENVIRONMENTS", false);
}

async function getAllBucketTests(bucketKey) {
	if (bucketKey === undefined || bucketKey.length <= 0) {
		return null;
	}

	let url = 'https://api.runscope.com/buckets/' + bucketKey + '/tests?count=200';
	return createRequest(url, "GET", "", "ALL BUCKET TESTS", false);
}

async function getAllSchedules(bucketKey, testId) {
	if (bucketKey === undefined || bucketKey.length <= 0 ||
		testId === undefined || testId.length <= 0) {
		return null;
	}

	let url = 'https://api.runscope.com/buckets/' + bucketKey + '/tests/' + testId + '/schedules';
	return createRequest(url, "GET", "", "ALL SCHEDULES", false);
}



async function getBucketIfExists(bucketKey, showSuccessMessage) {
	if (bucketKey.length <= 0) {
		throw "BUCKET KEY cannot be empty";
	}

	let url = "https://api.runscope.com/v1/buckets/" + bucketKey;
	let response;
	try {
		response = createRequest(url, "GET", "", "BUCKET", showSuccessMessage);
	} catch (e) {
		throw e;
	}

	return response;
}

async function getSharedEnvironmentIfExists(bucketKey, environmentId, showSuccessMessage) {
	if (bucketKey === undefined || bucketKey.length <= 0 ||
		environmentId === undefined || environmentId.length <= 0) {
		throw "BUCKET KEY and ENVIRONMENT ID cannot be empty";
	}

	let url = 'https://api.runscope.com/buckets/' + bucketKey + '/environments/' + environmentId;
	let response;
	try {
		response = createRequest(url, "GET", "", "SHARED ENVIRONMENT", showSuccessMessage);
	} catch (e) {
		throw e;
	}

	return response;
}

async function getTestDetailsIfExists(bucketKey, testId, showSuccessMessage) {
	if (bucketKey === undefined || bucketKey.length <= 0 ||
		testId === undefined || testId.length <= 0) {
		throw "BUCKET KEY and TEST ID cannot be empty";
	}

	let url = 'https://api.runscope.com/buckets/' + bucketKey + '/tests/' + testId;
	let response;
	try {
		response = createRequest(url, "GET", "", "TEST", showSuccessMessage);
	} catch (e) {
		throw e;
	}

	return response;
}

async function getTestEnvironmentIfExists(bucketKey, testId, environmentId, showSuccessMessage) {
	if (bucketKey.length <= 0 || testId.length <= 0 || environmentId.length <= 0) {
		throw "BUCKET KEY and TEST ID and ENVIRONMENT ID cannot be empty";
	}

	let url = 'https://api.runscope.com/buckets/' + bucketKey + '/tests/' + testId + '/environments/' + environmentId;
	let response;
	try {
		response = createRequest(url, "GET", "", "TEST ENVIRONMENT", showSuccessMessage);
	} catch (e) {
		throw e;
	}

	return response;
}

async function getStepIfExists(bucketKey, testId, stepId, showSuccessMessage) {
	if (bucketKey === undefined || bucketKey.length <= 0 ||
		testId === undefined || testId.length <= 0 ||
		stepId === undefined || stepId.length <= 0) {
		throw "BUCKET KEY and TEST ID and STEP ID cannot be empty";
	}

	let url = 'https://api.runscope.com/buckets/' + bucketKey + '/tests/' + testId + '/steps/' + stepId;
	let response;
	try {
		response = createRequest(url, "GET", "", "STEP", showSuccessMessage);
	} catch (e) {
		throw e;
	}

	return response;
}