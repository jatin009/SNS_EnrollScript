/*
*  Sectorwise Modifiables Script Properties:
* - Form ID
* - familyMemberRowObject columns
* - 'SNS/02/' Center code in Family Id
* - url of respective sector family sheet
* - family sheet name
*/

formDataArr = {};
const scriptProperties = PropertiesService.getScriptProperties();
var ss = SpreadsheetApp.openByUrl(scriptProperties.getProperty('familyUrl'));
var familySheet = ss.getSheetByName(scriptProperties.getProperty('familySheet'));
var studentSheet = ss.getSheetByName(scriptProperties.getProperty('studentSheet'));
var familySerial = Number(scriptProperties.getProperty('familySerial'));
var familyID = '';

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
    formDataArr[underscoredKey] = itemResponse.getResponse();
  }
}

function newFamilyEnrollment(itemResponses)
{
  for(var j=1; j<itemResponses.length; j++)
  {
    var itemResponse = itemResponses[j];
    var key = itemResponse.getItem().getTitle();
    var underscoredKey = key.replace(/ /g, "_");
    formDataArr[underscoredKey] = itemResponse.getResponse();
  }

  familyID = getFamilyID(familySerial + 1);

  var familyMemberRowObject = {
    'Head': [familySerial,familyID,'ACTIVE','Head of Family',formDataArr.Head_Name,'',formatDate(formDataArr.Head_DOB),'',formDataArr.Present_Address,formDataArr.Contact_Number, formDataArr.Head_Aadhar,'',formDataArr.Head_Qualification,formDataArr.Head_Occupation],
    'Spouse': ['','','','Spouse',formDataArr.Spouse_Name,'',formatDate(formDataArr.Spouse_DOB),'','SAME','SAME',formDataArr.Spouse_Aadhar, '',formDataArr.Spouse_Qualification, formDataArr.Spouse_Occupation]
  };
  for(var i=1;i<=formDataArr.Number_of_Children; i++)
  {
    var childId = 'Child_'+i;
    familyMemberRowObject[childId] = ['','','','Child No. '+i,formDataArr[childId+'_Name'],'',formatDate(formDataArr[childId+'_DOB']),'','SAME','SAME',formDataArr[childId+'_Aadhar'], '',''];
  }

  appendFamilyMemberRows( familyMemberRowObject);
}

function getFamilyID( newserialDigit)
{
  var fullyear = new Date().getFullYear().toString();   //2023
  var currentyear = fullyear.substring(2);              //23
  var savedyear = scriptProperties.getProperty('savedYear');
  if(currentyear != savedyear)
  {
    scriptProperties.setProperty('familySerial', '00');
    scriptProperties.setProperty('savedYear', currentyear);
    appendNewYearRow(fullyear);
  }
  var newSerialStr = ('0'+newserialDigit).slice(-2);
  var familyID = scriptProperties.getProperty('familyIDPrefix')+currentyear+'/'+newSerialStr;
  scriptProperties.setProperty('familySerial', newSerialStr);
  return familyID;
}

function appendFamilyMemberRows( rowObj)
{
  var familyHeadRow = colorGreenHeadRow();
  familySheet.appendRow(rowObj['Head']);
  familySheet.appendRow(rowObj['Spouse']);
  var studentSheetArr = [];

  for(var i=1;i<=formDataArr.Number_of_Children; i++)
  {
    var childId = 'Child_'+i;
    checkChildrenClass(rowObj, studentSheetArr, childId);
    familySheet.appendRow(rowObj[childId]);
    appendRowToStudentSheet(studentSheetArr, childId, familyHeadRow);
  }
}

function appendRowToStudentSheet(studentSheetArr, childId, familyHeadRow)
{
  studentSheet.appendRow(studentSheetArr[childId]);
  var newStudentRow = studentSheet.getLastRow();
  var rollno = studentSheet.getRange('D'+newStudentRow).getValue().toString();
  var hyperlink = '=HYPERLINK("'+scriptProperties.getProperty('familySheet')+'!B'+familyHeadRow+'", "'+rollno+'")';
  studentSheet.getRange('D'+newStudentRow).setValue(hyperlink);
}

function checkChildrenClass(rowObj, studentSheetArr, childId)
{
  var intChildId = Number(childId.slice(-1));
  var rollnoString = familyID+'-0';
  if(isSNSStudent(formDataArr[childId+'_Class']))
  {
    rowObj[childId].push('SNS Student');
    var lastRowSerial = Number(studentSheet.getRange('A'+studentSheet.getLastRow()).getValue().toString());
    studentSheetArr[childId] = [lastRowSerial+1,formDataArr[childId+'_Name'], '', rollnoString+(intChildId), formDataArr[childId+'_Class'], '', formatDate(formDataArr[childId+'_joined_SNS_on'])];
  }
}

function isSNSStudent(childclass)
{
  return (childclass != 'Not a SNS student' && childclass != 'Adult');
}

function appendNewYearRow( year)
{
  var newrow = familySheet.getLastRow()+1;
  familySheet.getRange(newrow, 1, 1, 33) .setBackground('#ff04fc');
  familySheet.appendRow(['',year]);
}

function colorGreenHeadRow()
{
  var newrow = familySheet.getLastRow()+1;
  familySheet.getRange(newrow, 1, 1, 33) .setBackground('#00ff00');
}

function formatDate(dob)
{
  return Utilities.formatDate(new Date(dob), "GMT+1", "dd-MMM-yyyy");
}