const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture');
const switchCameraButton = document.getElementById('switchCamera');
let useFrontCamera = true; // Default to front camera
let stream = null; // Store the active stream
const popup = document.getElementById('popup');
const capturedImage = document.getElementById('capturedImage');
const retryButton = document.getElementById('retry');
const downloadButton = document.getElementById('download');
const removeBgButton = document.getElementById('removeBgButton');
const closePopupButton = document.getElementById('closePopup');
const context = canvas.getContext('2d');
const colorSelectionPopup = document.getElementById('colorSelectionPopup');
const colorSelect = document.getElementById('colorSelect');
const applyColorButton = document.getElementById('applyColorButton');
const cancelColorButton = document.getElementById('cancelColorButton');

// Set your Remove.bg API key
const apiKey = 'F2hVNrWQ6wVwrjUArgfQuuJ7'; // Replace with your valid API key (Note: This API key has a limitation from remove.bg website tru jeribert16@gmail.com)

// Access the camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    console.log('Camera stream started');
    video.srcObject = stream;
  })
  .catch((error) => {
    console.error('Camera access error:', error);
    alert('Unable to access the camera. Please allow camera permissions.');
  });

// Function to start the camera with the selected facing mode
async function startCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop()); // Stop existing stream
  }

  const constraints = {
    video: {
      facingMode: useFrontCamera ? "user" : "environment"
    }
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Apply CSS transformation based on the camera
    if (useFrontCamera) {
      video.style.transform = "scaleX(-1)"; // Mirror the front camera
    } else {
      video.style.transform = "scaleX(1)"; // Normal for the back camera
    }
  } catch (error) {
    console.error("Camera access error:", error);
    alert("Unable to access the camera. Please allow camera permissions.");
  }
}

// Toggle between front and back camera
switchCameraButton.addEventListener('click', () => {
  useFrontCamera = !useFrontCamera; // Toggle camera mode
  startCamera(); // Restart camera with the new mode
});

// Start the default camera when the page loads
startCamera();
// Start the default camera when the page loads
startCamera();
// Capture image
captureButton.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Mirror the canvas context to match the mirrored video
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageDataURL = canvas.toDataURL();
  console.log('Image captured:', imageDataURL);

  // Show the captured image in the popup
  capturedImage.src = imageDataURL;
  popup.classList.remove('hidden');
});

// Remove background from the captured image
removeBgButton.addEventListener('click', () => {
  const imageDataURL = capturedImage.src;

  if (!imageDataURL) {
    alert('No image captured. Please capture an image first.');
    return;
  }

  const formData = new FormData();
  formData.append('image_file_b64', imageDataURL.split(',')[1]);
  formData.append('size', 'auto'); // Adjust size automatically

  console.log('Sending captured image to remove.bg for background removal...');

  fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      console.log('Background removal successful');
      return response.blob();
    })
    .then((blob) => {
      const imageUrl = URL.createObjectURL(blob);
      capturedImage.src = imageUrl;

      // Show the background selection popup
      colorSelectionPopup.classList.remove('hidden');
    })
    .catch((error) => {
      console.error('Error removing background:', error);
      alert('Background removal failed. Please try again.');
    });
});

// Apply color background if selected
applyColorButton.addEventListener('click', () => {
  const selectedColor = colorSelect.value;
  const imageDataURL = capturedImage.src;

  if (!imageDataURL) {
    alert('No image to update.');
    return;
  }

  // Create a new canvas to combine the image with the selected background color
  const tempCanvas = document.createElement('canvas');
  const tempContext = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  // Set the background color
  tempContext.fillStyle = selectedColor;
  tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw the captured image on top of the background
  const image = new Image();
  image.src = imageDataURL;
  image.onload = () => {
    tempContext.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);

    // Update the captured image with the new background
    capturedImage.src = tempCanvas.toDataURL('image/png');
  };

  // Hide the color selection popup
  colorSelectionPopup.classList.add('hidden');
});

// Cancel background color selection
cancelColorButton.addEventListener('click', () => {
  colorSelectionPopup.classList.add('hidden');
});

// Retry button: Close popup and show video again
retryButton.addEventListener('click', () => {
  console.log('Retry button clicked');
  popup.classList.add('hidden');
});

// Close popup button: Close the popup
closePopupButton.addEventListener('click', () => {
  console.log('Close popup button clicked');
  popup.classList.add('hidden');
});

// Download the background-removed image
downloadButton.addEventListener('click', () => {
  console.log('Download button clicked');
  const link = document.createElement('a');
  link.download = `background-removed-image.png`;
  link.href = capturedImage.src;
  link.click();
});

// Debug logging
console.log('Script loaded successfully');
