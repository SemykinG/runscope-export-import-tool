let noDefaultTestEnvironments = false;
let mainData = [];

async function exportAll() {
	textArea.value = "";

	noDefaultTestEnvironments = document.getElementById("no_default_test_environments_checkbox").checked;
	let bucketsChecked = document.getElementById("buckets_checkbox").checked;
	let sharedEnvironmentsChecked = document.getElementById("shared_environments_checkbox").checked;
	let testDetailsChecked = document.getElementById("test_details_checkbox").checked;
	let allInOne = document.getElementById("all_in_one_checkbox").checked;

	let bucketKeysArray = [];
	if (runscopeBucketIdInput.value.length > 0) {
		bucketKeysArray = runscopeBucketIdInput.value.replaceAll(" ", "").split(",");
	}


	/**
	 EXPORT BUCKETS
	 */
	if (bucketsChecked || allInOne) {
		if (!await exportBuckets(bucketsChecked, bucketKeysArray)) {
			textArea.value = textArea.value + "\r\n\nerror while getting BUCKETS";
			return;
		}
	}


	/**
	 EXPORT SHARED ENVIRONMENTS
	 */
	if (sharedEnvironmentsChecked || allInOne) {
		if (!await exportSharedEnvironments(sharedEnvironmentsChecked, allInOne, bucketKeysArray)) {
			textArea.value = textArea.value + "\r\n\nerror while getting SHARED ENVIRONMENTS";
			return;
		}
	}


	/**
	 EXPORT TEST DETAILS
	 */
	if (testDetailsChecked || allInOne) {
		if (!await exportTestDetails(testDetailsChecked, allInOne, bucketKeysArray)) {
			textArea.value = textArea.value + "\r\n\nerror while getting TEST DETAILS";
			return;
		}
	}

	if (allInOne) {
		download(JSON.stringify(mainData, null, 4), ALL_DATA_EXPORT_FILE_NAME + getCurrentTimestamp() + ".json", "text/plain");
	}

	textArea.value = textArea.value + "\r\n\nAll operations completed.";
}


async function exportBuckets(printBuckets, bucketKeysArray) {
	textArea.value = textArea.value + "\r\n\nGetting BUCKETS...";

	mainData.length = 0;

	let response;

	if (bucketKeysArray.length <= 0) {
		response = await getAllBuckets();
		if (response == null) {
			return false;
		}
		if (response.data.length <= 0) {
			return false;
		}
		response.data.forEach(function (bucket) {
			mainData.push(bucket);
		});
	} else {
		for (let bucketKey of bucketKeysArray) {
			try {
				response = await getBucketIfExists(bucketKey, false);
				if (response == null) {
					return false;
				}

				mainData.push(response.data);
			} catch (e) {
				return false;
			}
		}
	}

	if (printBuckets) {
		download(JSON.stringify(mainData, null, 4), BUCKETS_EXPORT_FILE_NAME + getCurrentTimestamp() + ".json", "text/plain");
	}

	return true;
}

async function exportSharedEnvironments(printSharedEnvironments, printAll, bucketKeysArray) {
	textArea.value = textArea.value + "\r\n\nGetting SHARED ENVIRONMENTS...";

	if (mainData.length <= 0) {
		if (!await exportBuckets(false, bucketKeysArray)) {
			return false;
		}
	}

	let allSharedEnvironments = [];

	for (let bucket of mainData) {
		let response = await getAllSharedEnvironments(bucket.key);

		if (response == null) {
			return false;
		}

		if (printSharedEnvironments) {
			let item = {};
			item ["name"] = bucket.name;
			item ["key"] = bucket.key;
			item ["bucket_shared_environments"] = response.data;

			allSharedEnvironments.push(item);
		}

		if (printAll) {
			bucket ["bucket_shared_environments"] = response.data;
		}
	}

	if (printSharedEnvironments) {
		download(JSON.stringify(allSharedEnvironments, null, 4), SHARED_ENVIRONMENTS_EXPORT_FILE_NAME + getCurrentTimestamp() + ".json", "text/plain");
	}

	return true;
}

async function exportTestDetails(printTests, printAll, bucketKeysArray) {
	textArea.value = textArea.value + "\r\n\nGetting TEST DETAILS...";

	if (!await getBucketTestIds(bucketKeysArray)) {
		return false;
	}

	// SOME INTERVAL VALUES EXPORT AS FLOATS (6.0h) WHICH ARE NOT ACCEPTABLE IN IMPORT
	// CHANGE INTERVAL VALUES TO CORRECT ONES DURING EXPORT
	let scheduleIntervals = [{"from":"1.0m", "to":"1m"},
		{"from":"5.0m", "to":"5m"},
		{"from":"15.0m", "to":"15m"},
		{"from":"30.0m", "to":"30m"},
		{"from":"1.0h", "to":"1h"},
		{"from":"6.0h", "to":"6h"},
		{"from":"1.0d", "to":"1d"},
	]

	let allTests = [];

	for (let bucket of mainData) {
		let testDetailsArray = [];

		for (let bucketTestId of bucket.bucket_test_ids) {
			let response = await getTestDetailsIfExists(bucket.key, bucketTestId, false);
			if (response == null) {
				return false;
			}

			for (let schedule of response.data["schedules"]) {
				for (let interval of scheduleIntervals) {
					if (schedule["interval"] === interval.from) {
						schedule["interval"] = interval.to;
					}
				}
			}

			if (noDefaultTestEnvironments) {
				let testEnvironments = [];

				for (let testEnvironment of response.data["environments"]) {
					if (testEnvironment.name !== "Test Settings") {
						testEnvironments.push(testEnvironment);
					}
				}

				response.data["environments"] = testEnvironments;
			}

			testDetailsArray.push(response.data);
		}

		if (printTests) {
			let item = {};
			item ["name"] = bucket.name;
			item ["key"] = bucket.key;
			item ["tests"] = testDetailsArray;

			allTests.push(item);
		}

		if (printAll) {
			bucket ["tests"] = testDetailsArray;
		}
	}

	if (printTests) {
		download(JSON.stringify(allTests, null, 4), TEST_DETAILS_EXPORT_FILE_NAME + getCurrentTimestamp() + ".json", "text/plain");
	}

	return true;
}


async function getBucketTestIds(bucketKeysArray) {

	if (mainData.length <= 0) {
		if (!await exportBuckets(false, bucketKeysArray)) {
			return null;
		}
	}

	for (let bucket of mainData) {
		let response = await getAllBucketTests(bucket.key);
		if (response == null) {
			return false;
		}

		let testIds = [];

		for (let test of response.data) {
			testIds.push(test.id);
		}

		bucket ["bucket_test_ids"] = testIds;
	}

	return true;
}
