function constructBucketsForAllData(buckets) {
	let checkboxes = [];

	let div = document.createElement('div');
	let tableHeader = document.createElement('h4');
	tableHeader.innerHTML = "BUCKETS"
	div.appendChild(tableHeader);

	let table = constructTable(checkboxes, ["Bucket Name", "Bucket ID", "No. Shared Env.", "No. Tests"]);

	for (let bucket of buckets) {
		let row = document.createElement('tr');

		row.appendChild(constructCheckboxColumn(checkboxes, bucket));

		for (let data of [bucket.name, bucket.key, bucket.bucket_shared_environments.length, bucket.tests.length]) {
			let column = document.createElement('td');
			let label = document.createElement('label');
			label.innerHTML = data;
			column.appendChild(label);

			row.appendChild(column);
		}

		table.appendChild(row);
	}

	div.appendChild(table);

	return div;
}

function constructCheckboxColumn(checkboxes, data) {
	let checkBoxColumn = document.createElement('td');
	let checkbox = document.createElement('input');
	checkbox.type = "checkbox";

	if (data.selected) {
		checkbox.click();
	}

	checkbox.addEventListener('change', function () {
		data.selected = checkbox.checked;
	});
	checkboxes.push(checkbox);
	checkBoxColumn.appendChild(checkbox);
	return checkBoxColumn;
}

function constructTable(checkboxes, columnNames) {
	let table = document.createElement('table');
	table.style.cssText += 'width:100%;padding-top:10px;padding-bottom:10px;text-align:left;';

	let headerRow = document.createElement('tr');

	let headerCheckboxColumn = document.createElement('th');
	let headerCheckbox = document.createElement('input');
	headerCheckbox.id = "header_checkbox"
	headerCheckbox.type = "checkbox";
	headerCheckboxColumn.appendChild(headerCheckbox);
	headerRow.appendChild(headerCheckboxColumn);

	for (let columnName of columnNames) {
		let headerColumn = document.createElement('th');
		let headerColumnName = document.createElement('label');
		headerColumnName.innerHTML = columnName;
		headerColumn.appendChild(headerColumnName);
		headerRow.appendChild(headerColumn);
	}

	table.appendChild(headerRow);

	headerCheckbox.addEventListener('change', function () {
		for (let checkbox of checkboxes) {
			checkbox.checked = !headerCheckbox.checked;
			checkbox.click();
		}
	});

	return table;
}