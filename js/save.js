
function WriteFile()
{

    var fh = fopen("\\MyFile.txt", 3); // Open the file for writing

    if(fh!=-1) // If the file has been successfully opened
    {
        var str = "Some text goes here...";
        fwrite(fh, str); // Write the string to a file
        fclose(fh); // Close the file
    }

}
function WriteFile1()
{
   var fso  = new ActiveXObject("Scripting.FileSystemObject");
   var fh = fso.CreateTextFile("c:\\Test.txt", true);
   fh.WriteLine("Some text goes here...");
   fh.Close();
}

function openFile(){
var fh = fopen(getScriptPath(), 0); // Open the file for reading
if(fh!=-1) // If the file has been successfully opened
{
    length = flength(fh);         // Get the length of the file
    str = fread(fh, length);     // Read in the entire file
    fclose(fh);                    // Close the file

// Display the contents of the file
    write(str);
}
}
