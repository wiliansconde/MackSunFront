document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/index.html";
      return;
    }
  
    const nameElement = document.getElementById("name");
    const storedName = localStorage.getItem("name");
  
    if (storedName && nameElement) {
      nameElement.textContent = storedName;
      nameElement.href = "/updateprofiledata.html";
    }
  
    const leaveButton = document.getElementById("leave");
    if (leaveButton) {
      leaveButton.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        window.location.href = "/index.html";
      });
    }
});
  