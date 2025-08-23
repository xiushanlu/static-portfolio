// Include EmailJS SDK in your HTML head:

emailjs.init({
  publicKey: '73gnohyxOOL1_1eHh', // Replace with your EmailJS Public Key
});

document.getElementById('contact-form').addEventListener('submit', function(event) {
  event.preventDefault();

  emailjs.sendForm('service_cr89eyx', 'YOUR_TEMPLATE_ID', this) // Replace with your Service ID and Template ID
    .then(function() {
      alert('Message sent successfully!');
    }, function(error) {
      alert('Failed to send message: ' + error);
    });
});