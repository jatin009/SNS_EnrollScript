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
var familyID;

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
  familyID = getFamilyID(newserialDigit);

  var memberRowObject = {
    'Head': [serialDigit,familyID,'ACTIVE','Head of Family',record_array.Head_Name,'',formatDate(record_array.Head_DOB),'',record_array.Present_Address,record_array.Contact_Number, record_array.Head_Aadhar,'',record_array.Head_Qualification,record_array.Head_Occupation],
    'Spouse': ['','','','Spouse',record_array.Spouse_Name,'',formatDate(record_array.Spouse_DOB),'','SAME','SAME',record_array.Spouse_Aadhar, '',record_array.Spouse_Qualification, record_array.Spouse_Occupation]
  };
  for(var i=1;i<=record_array.Number_of_Children; i++)
  {
    var childId = 'Child_'+i;
    memberRowObject[childId] = ['','','','Child No. '+i,record_array[childId+'_Name'],'',formatDate(record_array[childId+'_DOB']),'','SAME','SAME',record_array[childId+'_Aadhar'], '',''];
  }

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
  sheet.appendRow(rowObj['Head']);
  sheet.appendRow(rowObj['Spouse']);
  var studentsheet = SpreadsheetApp.openByUrl(scriptProperties.getProperty('studentUrl')).getSheetByName(scriptProperties.getProperty('studentSheet'));
  var studentSheetArr = [];

  for(var i=0;i<record_array.Number_of_Children; i++)
  {
    var index = 'Child_'+(i+1);
    sheet.appendRow(rowObj[index]);
    checkChildrenClass(rowObj, studentSheetArr, index);
    studentsheet.appendRow(studentSheetArr[i]);
  }
}

function checkChildrenClass(rowObj, studentSheetArr, childindex)
{
  var serno = 0;
  var rollnoString = familyID+'-0';
  var childclass = childindex+'_Class';
  var childname = childindex+'_Name';
  var childjoinedon = childindex+'_joined_SNS_on';
  //ToDo: Insert link for roll nos
  if(isSNSStudent(record_array[childindex+'_'+childclass]))
  {
    rowObj[childindex].push('SNS Student');
    studentSheetArr.push(['',record_array[childname], '', rollnoString+(++serno), record_array[childclass], '', formatDate(record_array[childjoinedon])]);
  }
}

function isSNSStudent(childclass)
{
  return (childclass != 'Not a SNS student' && childclass != 'Adult');
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
  return Utilities.formatDate(new Date(dob), "GMT+1", "dd-MMM-yyyy");
}