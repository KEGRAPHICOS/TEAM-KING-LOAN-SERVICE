 function calculateInterest() {
      const amount = parseFloat(document.getElementById("amount").value.replace(/[^0-9.]/g, ''));
      if (!isNaN(amount)) {
        const interest = amount * 0.2;
        document.getElementById("interest").value = `GHS ${interest.toFixed(2)} (20% Interest)`;
        document.getElementById("income").value = `GHS ${(amount + interest).toFixed(2)} (Total Payable)`;
      } else {
        document.getElementById("interest").value = "";
        document.getElementById("income").value = "";
      }
    }

    function sendViaWhatsApp() {
      const form = document.getElementById("loanForm");
      if (!form.checkValidity()) {
        alert("Please fill out all required fields before clicking the Request Now button");
        return;
      }

      const date = document.getElementById("date").value;
      const fname = document.getElementById("fname").value;
      const lname = document.getElementById("lname").value;
      const email = document.getElementById("email").value;
      const mphone = document.getElementById("mphone").value;
      const type1 = document.getElementById("type1").value;
      const amount = document.getElementById("amount").value;
      const interest = document.getElementById("interest").value;
      const income = document.getElementById("income").value;
      const type = document.getElementById("type").value;
      const gname = document.getElementById("gname").value;
      const gphone = document.getElementById("gphone").value;
      const gaddress = document.getElementById("gaddress").value;
      const grelationship = document.getElementById("grelationship").value;

      const message = `
*Greetings Sir, I hope you’re doing well. I would like to formally request a loan and I kindly ask for your consideration of my application*     

*APPLICANT'S INFORMATION*

*Date:* ${date}  

*First Name:* ${fname}  

*Last Name:* ${lname} 

*Email:* ${email} 

*Momo Number:* ${mphone} 

*Momo Network:* ${type1} 

*Loan Amount:* ${amount} 

*Interest:* ${interest}

*Total Payable:* ${income}

*Loan Type:* ${type}  


*GUARANTOR'S INFORMATION* 

*Full Name:* ${gname}

*Phone:* ${gphone} 

*Address:* ${gaddress} 

*Relationship:* ${grelationship}  

*THANK YOU*
      `;

      const url = `https://wa.me/233542519746?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
