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
var familySheet, studentSheet, familySerial, familyID, familyUrlVariable, familySerialVariable, familyIDPrefixVariable, studentUrlVariable;

function onFormSubmit(event) 
{
  var form = FormApp.openById(scriptProperties.getProperty('formID')); // Form ID

  var formResponses = form.getResponses();
  var formCount = formResponses.length;

  var formResponse = formResponses[formCount - 1];
  var itemResponses = formResponse.getItemResponses();

  var centerSelection = itemResponses[0].getResponse();
  var centerPrefixScriptProp = getPrefixForScriptProperties(centerSelection);
  if(centerPrefixScriptProp != null)
  {
    updateGlobalVariables(centerPrefixScriptProp);

    var purpose = itemResponses[1].getResponse();
    if(purpose == "Student leaving")
    {
      studentLeaving(itemResponses);
    }
    else
    {
      newFamilyEnrollment(itemResponses);
    }
  }
}

function updateGlobalVariables(centerPrefixScriptProp)
{
  familyUrlVariable = centerPrefixScriptProp+'familyUrl';
  familySerialVariable = centerPrefixScriptProp+'familySerial';
  familyIDPrefixVariable = centerPrefixScriptProp+'familyIDPrefix';
  studentUrlVariable = centerPrefixScriptProp+'StudentUrl';
  var spreadsheet = SpreadsheetApp.openByUrl(scriptProperties.getProperty(familyUrlVariable));
  familySheet = spreadsheet.getSheetByName(scriptProperties.getProperty('familySheet'));
  studentSheet = spreadsheet.getSheetByName(scriptProperties.getProperty('studentSheet'));
  familySerial = Number(scriptProperties.getProperty(familySerialVariable));
}

function getPrefixForScriptProperties(centerCode)
{
  if(centerCode == "Sector 2")
  {
    return 'sec2';
  }
  else if(centerCode == "Sector 6")
  {
    return 'sec6';
  }
  else if(centerCode == "Sector 19")
  {
    return 'sec19';
  }
  else return null;
}

function studentLeaving(itemResponses)  //ToDo
{
 for(var j=2; j<itemResponses.length; j++)
  {
    var itemResponse = itemResponses[j];
    var key = itemResponse.getItem().getTitle();
    var underscoredKey = key.replace(/ /g, "_");
    formDataArr[underscoredKey] = itemResponse.getResponse();
  }
}

function newFamilyEnrollment(itemResponses)
{
  for(var j=2; j<itemResponses.length; j++)
  {
    var itemResponse = itemResponses[j];
    var key = itemResponse.getItem().getTitle();
    var underscoredKey = key.replace(/ /g, "_");
    formDataArr[underscoredKey] = itemResponse.getResponse();
  }

  var nextFamilySerial = familySerial + 1;
  familyID = getFamilyID(nextFamilySerial);

  var familyMemberRowObject = {
    'Head': ['',familyID,'Head of Family',formDataArr.Head_Name,formDataArr.Head_Gender,formatDate(formDataArr.Head_DOB),formDataArr.Present_Address,formDataArr.Contact_Number, formDataArr.Head_Aadhar,formDataArr.Head_Qualification,formDataArr.Head_Occupation],
    'Spouse': ['','','Spouse',formDataArr.Spouse_Name,formDataArr.Spouse_Gender,formatDate(formDataArr.Spouse_DOB),'SAME','SAME',formDataArr.Spouse_Aadhar,formDataArr.Spouse_Qualification, formDataArr.Spouse_Occupation]
  };
  for(var i=1;i<=formDataArr.Number_of_Children; i++)
  {
    var childId = 'Child_'+i;
    familyMemberRowObject[childId] = ['','','Child No. '+i,formDataArr[childId+'_Name'],formDataArr[childId+'_Gender'],formatDate(formDataArr[childId+'_DOB']),'SAME','SAME',formDataArr[childId+'_Aadhar'],''];
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
    scriptProperties.setProperty(familySerialVariable, '00');
    scriptProperties.setProperty('savedYear', currentyear);
    appendNewYearRow(fullyear);
  }
  var newSerialStr = ('0'+newserialDigit).slice(-2);
  var familyID = scriptProperties.getProperty(familyIDPrefixVariable)+currentyear+'/'+newSerialStr;
  scriptProperties.setProperty(familySerialVariable, newSerialStr);
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
    var isSNSStudent = checkChildrenClass(rowObj, studentSheetArr, childId);
    familySheet.appendRow(rowObj[childId]); //set yellow color to student name and set hyperlink
    if(isSNSStudent == true)
    {
      colorSNSStudentRowYellowInFamilySheet();
      studentSheet.appendRow(studentSheetArr[childId]);
      setHyperlinkToRollNo(familyHeadRow);
    }
  }
}

function colorSNSStudentRowYellowInFamilySheet()
{
  var childRow = familySheet.getLastRow();
  familySheet.getRange(childRow, 4).setBackground("#ffff00"); // yellow color
}

function setHyperlinkToRollNo(familyHeadRow)
{
  var newStudentRow = studentSheet.getLastRow();
  var rollno = studentSheet.getRange('E'+newStudentRow).getValue().toString();
  var hyperlink = '=HYPERLINK("'+scriptProperties.getProperty(familyUrlVariable)+'&range=B'+familyHeadRow+'", "'+rollno+'")';
  studentSheet.getRange('E'+newStudentRow).setValue(hyperlink);
}

function checkChildrenClass(rowObj, studentSheetArr, childId)
{
  var intChildId = Number(childId.slice(-1));
  var rollnoString = familyID+'-0';
  if(isSNSStudent(formDataArr[childId+'_Class']))
  {
    rowObj[childId].push(getStudentRowHyperlink());
    var lastRowSerial = Number(studentSheet.getRange('A'+studentSheet.getLastRow()).getValue().toString());
    studentSheetArr[childId] = [lastRowSerial+1,formDataArr[childId+'_Name'],formDataArr[childId+'_Gender'],formatDate(formDataArr[childId+'_DOB']), rollnoString+(intChildId), formDataArr[childId+'_Class'], '',formDataArr.Contact_Number, formatDate(formDataArr[childId+'_joined_SNS_on'])];
    return true;
  }
  return false;
}

function getStudentRowHyperlink()
{
    var newStudentRow = studentSheet.getLastRow()+1;
    var hyperlink = '=HYPERLINK("'+scriptProperties.getProperty(studentUrlVariable)+'&range=B'+newStudentRow+'", "SNS Student")';
    return hyperlink;
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
  familySheet.getRange(newrow, 1, 1, 33) .setBackground('#00ff00'); // green color
  return newrow;
}

function formatDate(dob)
{
  return Utilities.formatDate(new Date(dob), "GMT+1", "dd-MMM-yyyy");
}