/*
*  Sectorwise Modifiables Script Properties:
* - Form ID
* - memberRowObject columns
* - 'SNS/02/' Center code in Family Id
* - url of respective sector family sheet
* - family sheet name
*/

record_array = {};
const scriptProperties = PropertiesService.getScriptProperties();
var ss= SpreadsheetApp.openByUrl(scriptProperties.getProperty('url'));
var sheet = ss.getSheetByName(scriptProperties.getProperty('sheetname'));
var serialDigit = Number(scriptProperties.getProperty('serialno'));

function onFormSubmit(event) 
{
  var form = FormApp.openById(scriptProperties.getProperty('formID')); // Form ID

  var formResponses = form.getResponses();
  var formCount = formResponses.length;

  var formResponse = formResponses[formCount - 1];
  var itemResponses = formResponse.getItemResponses();

  var purpose = itemResponses[0];
  if(purpose.getResponse() == "Student leaving")
  {
    studentLeaving(itemResponses);
  }
  else
  {
    newFamilyEnrollment(itemResponses);
  }
}

function studentLeaving(itemResponses)
{
  for(var j=1; j<itemResponses.length; j++)
  {
    var itemResponse = itemResponses[j];
    var key = itemResponse.getItem().getTitle();
    var underscoredKey = key.replace(/ /g, "_");
    record_array[underscoredKey] = itemResponse.getResponse();
  }
}

function newFamilyEnrollment(itemResponses)
{
  for(var j=1; j<itemResponses.length; j++)
  {
    var itemResponse = itemResponses[j];
    var key = itemResponse.getItem().getTitle();
    var underscoredKey = key.replace(/ /g, "_");
    record_array[underscoredKey] = itemResponse.getResponse();
  }

  var newserialDigit = serialDigit + 1;
  var familyID = getFamilyID(newserialDigit);

  var memberRowObject = {
    'Head': [serialDigit,familyID,'ACTIVE','Head of Family',record_array.Head_Name,'',formatDate(record_array.Head_DOB),'',record_array.Present_Address,record_array.Contact_Number, record_array.Head_Aadhar,'',record_array.Head_Qualification,record_array.Head_Occupation],
    'Spouse': ['','','','Spouse',record_array.Spouse_Name,'',formatDate(record_array.Spouse_DOB),'','SAME','SAME',record_array.Spouse_Aadhar, '',record_array.Spouse_Qualification, record_array.Spouse_Occupation],
    'Child 1': ['','','','Child No. 1',record_array.Child_1_Name,'',formatDate(record_array.Child_1_DOB),'','SAME','SAME',record_array.Child_1_Aadhar, '',''],
    'Child 2': ['','','','Child No. 2',record_array.Child_2_Name,'',formatDate(record_array.Child_2_DOB),'','SAME','SAME',record_array.Child_2_Aadhar, '',''],
    'Child 3': ['','','','Child No. 3',record_array.Child_3_Name,'',formatDate(record_array.Child_3_DOB),'','SAME','SAME',record_array.Child_3_Aadhar, '',''],
    'Child 4': ['','','','Child No. 4',record_array.Child_4_Name,'',formatDate(record_array.Child_4_DOB),'','SAME','SAME',record_array.Child_4_Aadhar, '','']
  };
  
  appendFamilyMemberRows( memberRowObject);
}

function getFamilyID( newserialDigit)
{
  var fullyear = new Date().getFullYear().toString();
  var currentyear = fullyear.substring(2);
  var savedyear = scriptProperties.getProperty('year');
  if(currentyear != savedyear)
  {
    scriptProperties.setProperty('serialno', '00');
    scriptProperties.setProperty('year', currentyear);
    appendNewYearRow(sheet, fullyear);
  }
  var serial = ('0'+newserialDigit).slice(-2);
  var familyID = scriptProperties.getProperty('familyIDPrefix')+currentyear+'/'+serial;
  scriptProperties.setProperty('serialno', serial);
  return familyID;
}

function appendFamilyMemberRows( rowObj)
{
  colorGreenHeadRow(sheet);
  checkChildrenClass(rowObj);
  sheet.appendRow(rowObj['Head']);
  sheet.appendRow(rowObj['Spouse']);
  for(var i=1;i<=record_array.Number_of_Children; i++)
  {
    var index = 'Child '+i;
    sheet.appendRow(rowObj[index]);
  }
}

function checkChildrenClass(rowObj)
{
  if(record_array.Child_1_Class != 'Not a SNS student' && record_array.Child_1_Class != 'Adult')
  {
    var child_class = 'SNS Student ('+record_array.Child_1_Class+')';
    rowObj['Child 1'].push(child_class);
  }
  if(record_array.Child_2_Class != 'Not a SNS student' && record_array.Child_2_Class != 'Adult')
  {
    var child_class = 'SNS Student ('+record_array.Child_2_Class+')';
    rowObj['Child 2'].push(child_class);
  }
  if(record_array.Child_3_Class != 'Not a SNS student' && record_array.Child_3_Class != 'Adult')
  {
    var child_class = 'SNS Student ('+record_array.Child_3_Class+')';
    rowObj['Child 3'].push(child_class);
  }
  if(record_array.Child_4_Class != 'Not a SNS student' && record_array.Child_4_Class != 'Adult')
  {
    var child_class = 'SNS Student ('+record_array.Child_4_Class+')';
    rowObj['Child 4'].push(child_class);
  }
}

function appendNewYearRow( year)
{
  var lastrow = sheet.getLastRow()+1;
  sheet.getRange(lastrow, 1, 1, 33) .setBackground('#ff04fc');
  sheet.appendRow(['',year]);
}

function colorGreenHeadRow()
{
  var lastrow = sheet.getLastRow()+1;
  sheet.getRange(lastrow, 1, 1, 33) .setBackground('#00ff00');
}

function formatDate(dob)
{
  return Utilities.formatDate(new Date(dob), "GMT+1", "dd/MM/yyyy");
}