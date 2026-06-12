document.addEventListener("DOMContentLoaded" , function (){
    const reasetForm = document.getElementById("resetForm");

    if(resetForm) {
        resetForm.addEventListener("submit" , function (e) {
            e.preventDefault();

            const password = document.getElementById("password").value;
            const conPass = document.getElementById("confirmPassword").value;

            if(password != conPass){
                alert("Password Not Match");
                return;
            }

            const param = new URLSearchParams(window.parent.location.search);
            const token = param.get("token");

            console.log("The url is here:" , param);
            console.log("Here is the TOken:" , token);

            if(!token){
                alert("Invalid Or missing token");
                console.log(token);
                return;
            }
    
    fetch(`http://localhost:8619/api/auth/resetPassword?token=${token}&newPassword=${password}`, {
    method: "POST"
})

    .then(res => {
      if (!res.ok) throw new Error("Reset failed");
      return res.text();
    })
    .then(data => {
      alert("Password updated successfully ✅");
    })
    .catch(err => {
      console.error(err);
      alert("Error resetting password ❌");    });
  })
    }
});
