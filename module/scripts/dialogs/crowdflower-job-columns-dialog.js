
function ZemantaCrowdFlowerDialog(onDone) {
  this._onDone = onDone;
  this._extension = {};
  this._mappedFields = [];
  var dismissBusy = DialogSystem.showBusy();
    
  this._dialog = $(DOM.loadHTML("crowdsourcing", "scripts/dialogs/crowdflower-job-columns-dialog.html"));
  this._elmts = DOM.bind(this._dialog);
  this._elmts.dialogHeader.text("Upload data to CrowdFlower");
  
  this._elmts.jobTabs.tabs();

  var tabindex = 0;

  
  this._renderAllExistingJobs();
  this._renderAllColumns2(this._elmts.columnsMenu_0, this._elmts.columnList_0, tabindex);
  
  var self = this;
  
  this._elmts.columnsPanel.hide();
  
  //TODO: hide this after testing
  this._elmts.extFieldsPanel.hide();
  this._elmts.extColumnsPanel.hide();
  
  this._elmts.chkUploadToNewJob.click(function () {
	
	  if(self._elmts.chkUploadToNewJob.is(':checked')) {
		  self._elmts.columnsPanel.show();
	  }
	  else {
		  self._elmts.columnsPanel.hide();
	  }
	  
  });
  
  this._elmts.okButton.click(function() {
	  self._extension = {};
      self._extension.title= self._elmts.jobTitle.val();
      self._extension.instructions = self._elmts.jobInstructions.val();
      self._extension.content_type = "json";
      self._extension.column_names = [];
      
	  var curTabPanel = $('#jobTabs .ui-tabs-panel:not(.ui-tabs-hide)');	  
	  var tabindex = curTabPanel.index();

	  if(tabindex == 0) {
		  self._extension.new_job = true;  
		  console.log("Creating new job...");
	  } else {
		  self._extension.new_job = false;
		  console.log("Uploading to existing job...");
	  }
      
	  //TODO: it depends on which tab is selected and if job already has fields defined!!!
	  if(tabindex === 0) {
	      $('#project-columns-' + tabindex +' input.zem-col:checked').each( function() {
	    	  var col = {};
	    	  col.name = $(this).attr('value');
	    	  col.safe_name = ZemantaExtension.util.convert2SafeName(col.name);
	    	  self._extension.column_names.push(col);
	      });
	  } else {
		  //if fields exist, then take those, check for mappings
		  
		  //else take column names
	  }
      
      if(self._extension.column_names.length < 1) {
    	  alert("No column was selected! Cannot upload data.");
      }
      else {
    	  self._extension.upload = true;
    	  console.log("Columns: " + JSON.stringify(self._extension.column_names));
    	  DialogSystem.dismissUntil(self._level - 1);
    	  self._onDone(self._extension);
      }
  });
  
  
  this._elmts.cancelButton.click(function() {	  
    DialogSystem.dismissUntil(self._level - 1);
  });
   
  
  this._elmts.jobTitle.blur(function () {
	  var title = self._elmts.jobTitle.val();	  
	  if(title.length < 5 || title.length > 255  ) {
		  $('#title-warning').show();
	  } else {
		  $('#title-warning').hide();
	  }
  });
  
  this._elmts.jobInstructions.blur(function () {
	  var instructions = self._elmts.jobInstructions.val();	  
	  if(instructions ===""  ) {
		  $('#instructions-warning').show();
	  } else {
		  $('#instructions-warning').hide();
	  }
  });
  
  this._elmts.copyJobButton.click(function() {
	  var job_id = self._elmts.allJobsList.val();

	  if(job_id === "none") {
		  alert("First select job to copy!");
	  }
	  else {
		  self._copyAndUpdateJob(job_id);
	  }
	  
  });
  
  dismissBusy();
  this._level = DialogSystem.showDialog(this._dialog);
  
};

ZemantaCrowdFlowerDialog.prototype._copyAndUpdateJob = function(jobid) {
	
	var self = this;
	self._extension = {};
	self._extension.job_id = jobid;
	
	ZemantaExtension.util.copyJob(self._extension, function(data){
	  console.log("Copy results: " + JSON.stringify(data));
	  self._updateJobList(data);
	});
	
};


ZemantaCrowdFlowerDialog.prototype._updateJobList = function(data) {
	var self = this;
	var selContainer = self._elmts.allJobsList;
	var selected = "";
	var status = data["status"];
    var dismissBusy = DialogSystem.showBusy();

	console.log("Data: " + JSON.stringify(data));
	
	selContainer.empty();
	
	$('<option name="opt_none" value="none">--- select a job --- </option>').appendTo(selContainer);
	

	if(status === "ERROR") {
		self._elmts.statusMessage.html(status + ": " + data["message"]);
	}
	else {
	
		self._elmts.statusMessage.html("OK");
		
		if(data["jobs"] && data["jobs"]!= null) {
			var jobs = data["jobs"];
		
			for (var index = 0; index < jobs.length; index++) {
				var value = jobs[index];
				console.log("Value: " + value);
				
				if(value.id === data.job_id) {
					selected = " selected";
				} else {
					selected = "";
				}
				
				var job = $('<option name="opt_' + index + '" value=' + value.id + '' + selected + '>' + value.title + ' (job id: ' + value.id + ')</option>');		
				selContainer.append(job);
		
			}
		}
	}

	
	dismissBusy();
};

ZemantaCrowdFlowerDialog.prototype._renderAllExistingJobs = function() {
	
	var self = this;
	var selContainer = self._elmts.allJobsList;
	var elemStatus = self._elmts.statusMessage;
	
	$('<option name="opt_none" value="none">--- select a job --- </option>').appendTo(selContainer);
	
	
	
	ZemantaExtension.util.loadAllExistingJobs(function(data, status) {
		
		elemStatus.html("Status: " + status);
	
		//TODO: remove this
		data = [{"job_id":"1","title":"test1"}];
		
		$.each(data, function(index, value) {
			
			var title = (value.title == null)? "Title not defined" : value.title;
			var job = $('<option name="opt_' + index + '" value=' + value.id + '>' + title + ' (job id: ' + value.id + ')</option>');
			selContainer.append(job);
		});
		
		selContainer.change(function() {
			this._extension = {};
			this._extension.job_id = $(this).children(":selected").val();
			this._selectedJob = this._extension.job_id;
			
			console.log("Job id changed:" + JSON.stringify(this._extension));
			
			ZemantaExtension.util.getJobInfo(this._extension, function(data){
				 self._updateJobInfo(data);
			});
		});
	});
};

ZemantaCrowdFlowerDialog.prototype._updateJobInfo = function(data) {

	var self = this;
	var elm_jobTitle = self._elmts.extJobTitle;
	var elm_jobInstructions = self._elmts.extJobInstructions;
	var elm_cml = self._elmts.extCml;

	console.log("... updating job info");
	var status = data["status"];
	
	if(status === "ERROR") {
		self._elmts.statusMessage.html(status + ': ' + data["message"]);
	} else {
		self._elmts.statusMessage.html(status);
	}
	
	if(data["title"] === null || data["title"] === "" ) {
		elm_jobTitle.val("(title undefined)");
	} else {
		elm_jobTitle.val(data["title"]);
	}
	
	if(data["instructions"] === null || data["instructions"] === "") {
		elm_jobInstructions.html("(instructions undefined)");
	}
	else {
		elm_jobInstructions.html(data["instructions"]);
	}
	
	if(data["cml"] === "[]" || data["cml"] === null) {
		elm_cml.html("(no cml defined )");
	} else {
		elm_cml.html(data["cml"]);
	}
	
	//TODO: remove this
	data["fields"] = ["test_field1","test_field2"];
	//data["fields"] = [];
	
	if(data["fields"].length > 0) {
		console.log("Job has fields");
		self._elmts.extFieldsPanel.show();
		self._elmts.extColumnsPanel.hide();
		var elm_fields = self._elmts.extJobFields;
		elm_fields.empty();

		//TODO: move code for dialog out of this code - to the main dialog instead
		//OR use same thing freebase is using for dialog
		var columnDialog = $('<div id="columns-dialog" title="Test"></div>');
		$('<div id="col-container"></div>').appendTo(columnDialog);
		var columnListContainer = $('<div id="col-list-container"></div>').appendTo(columnDialog);

		console.log("Rendering columns....");
		var columns = theProject.columnModel.columns;
		
		$.each(columns, function(index, value){
			$('<input type="radio" name="columns" class="zem-col" value="' + value.name + '">' + value.name + '</input><br/>').appendTo(columnListContainer);					
		});
		
		columnDialog.dialog({
		
				autoOpen: false,
				modal: true,
				closeOnEscape: true,
				buttons: {
					"Map": function() {
						var fname = columnDialog.data('fieldName');
						var fc = {};
						console.log("Field name: " + $(this).data('fieldName'));
						fc.field = columnDialog.data('fieldName');
						fc.column = $('input[name=columns]:checked').val();
						
						self._mappedFields.push(fc);
						//update some list or something
						console.log(JSON.stringify("Mappings! " + JSON.stringify(self._mappedFields)));
						$(this).dialog('close'); 
					},
					Cancel: function () {
						$(this).dialog('close'); 
					}
				},
		});
					
		
		$.each(data["fields"], function(index, value) {
			var link = $('<a title="' + value + '" href="javascript:{}">' + value + '</a><br/>').appendTo(elm_fields);
		
			link.click (function(){
				console.log("Link text: " + $(this).text());
				
				//TODO: add existing mapping
				ZemantaCrowdFlowerDialog.showColumnsDialog($(this).text(),"Anchor", function(newMapping) {
					//update mapping
					console.log("New mapping: " + newMapping);
				});
				//columnDialog.data('fieldName', $(this).text()).dialog("open");
			});		
		});		
	} else {
		self._elmts.extFieldsPanel.hide();
		var tabindex = 1;
		self._renderAllColumns2(self._elmts.columnsMenu_1, self._elmts.columnList_1, tabindex);
		this._elmts.extColumnsPanel.show();
	}
	
	
};

ZemantaCrowdFlowerDialog.prototype._renderAllColumns2 = function(columnContainer, columnListContainer, tabindex) {
	  
	//var self = this;
	var columns = theProject.columnModel.columns;
	
	var chkid = 0;

	var renderColumns = function(columns, elem) {
		
		$.each(columns, function(index, value){
			var id = 'chk_' + tabindex + '_' + chkid;
			var input = $('<input type="checkbox" class="zem-col" value="' + value.name + '" id="' + id + '"/>').appendTo(elem);
			$('<label for="' + id + '">' + value.name + '</label> <br/>').appendTo(elem);
			chkid++;
						
			input.click(function() {
				$('#cml-preview-panel-' + tabindex).html(ZemantaExtension.util.generateCML(tabindex));
			});
		});
	};
	
	var linkSelectAll = $('<a href="#" id="select-all-columns-' + tabindex +'"> Select all </a>');
	columnContainer.append(linkSelectAll);
	var linkClearAll = $('<a href="#" id="clear-all-columns-' + tabindex + '"> Clear all </a>');
	columnContainer.append(linkClearAll);

	renderColumns(columns, columnListContainer);
	
	linkClearAll.click(function () {
		$('#project-columns-' + tabindex + ' input.zem-col').each(function () {
			$(this).attr('checked', false);
		});
		$('#cml-preview-panel-' + tabindex).html(ZemantaExtension.util.generateCML(tabindex));
	});
	
	linkSelectAll.click(function() {
		$('#project-columns-'+ tabindex + ' input.zem-col').each(function () {
			$(this).attr('checked', true);
		});
		$('#cml-preview-panel-' + tabindex).html(ZemantaExtension.util.generateCML(tabindex));
	});
};


ZemantaCrowdFlowerDialog.showColumnsDialog = function(field, mapped_col, onDone) {
	
	var frame = DialogSystem.createDialog();
	  frame.width("500px");

	  var header = $('<div></div>').addClass("dialog-header").text("Add mapping for field: " + field).appendTo(frame);
	  var body = $('<div></div>').addClass("dialog-body").appendTo(frame);
	  var footer = $('<div></div>').addClass("dialog-footer").appendTo(frame);

	  var columns = theProject.columnModel.columns;
	  
	  body.html(
			  '<div class="grid-layout layout-normal layout-full">' +
			 '<div id="columns" bind="projColumns" class="project-columns"></div>' +
			 '</div>'
	  );
	  
	  var bodyElmts = DOM.bind(body);
	  $.each(columns, function(index, value){
		
		  var input = $('<input type="radio" name="columns" class="zem-col" value="' + value.name + '">' + value.name + '</input><br/>').appendTo(bodyElmts.projColumns);					
		  if(value.name === mapped_col) {
			  input.attr("checked","true");
		  }

	  });

	  footer.html(
			    '<button class="button" bind="okButton">&nbsp;&nbsp;OK&nbsp;&nbsp;</button>' +
			    '<button class="button" bind="cancelButton">Cancel</button>'
			  );
	  var footerElmts = DOM.bind(footer);

	  var level = DialogSystem.showDialog(frame);
	  var dismiss = function() {
	    DialogSystem.dismissUntil(level - 1);
	  };

	  footerElmts.cancelButton.click(dismiss);
	  footerElmts.okButton.click(function() {
		  console.log("Column selected:" + $('input[name=columns]:checked').val());
		  mapped_col = $('input[name=columns]:checked').val();
		  onDone(mapped_col);
		  
		  dismiss();
	  });
			 	  
	
};

