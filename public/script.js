async function fetchLeaveRequests() {
    try {
      const response = await fetch('/api/leave');
      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }
      const data = await response.json();
      const notificationList = document.getElementById('notificationList');
      notificationList.innerHTML = '';
  
      data.forEach(leave => {
        const li = document.createElement('li');
        li.textContent = `${leave.message} - ${leave.location}`;
        notificationList.appendChild(li);
      });
  
      const notificationCount = document.getElementById('notificationCount');
      notificationCount.textContent = data.length.toString(); 
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch leave requests');
    }
  }
  
  function updateNotifications(leaves) {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '';
  
    leaves.forEach(leave => {
      const li = document.createElement('li');
      li.textContent = `${leave.message} - ${leave.location}`;
      notificationList.appendChild(li);
    });
  
    const notificationCount = document.getElementById('notificationCount');
    notificationCount.textContent = leaves.length.toString();
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    fetchLeaveRequests();
  
    const socket = io();
    socket.on('newLeaveRequest', (leave) => {
      fetchLeaveRequests();
  
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Leave Request', {
          body: `${leave.message} - ${leave.location}`,
        });
      }
    });
  
    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        }
      });
    }
  
    // Request location permission and get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async position => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem('latitude', latitude);
        localStorage.setItem('longitude', longitude);
  
        const location = await getLocationFromCoordinates(latitude, longitude);
        localStorage.setItem('location', location);
      }, error => {
        console.error('Error getting location:', error);
      });
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  });
  
  async function getLocationFromCoordinates(latitude, longitude) {
    const apiKey = 'API_KEY'; 
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      } else {
        return 'Location not found';
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      return 'Error fetching location';
    }
  }
  
  const form = document.getElementById('leaveForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('leaveMessage').value;
    const latitude = localStorage.getItem('latitude');
    const longitude = localStorage.getItem('longitude');
    const location = localStorage.getItem('location');
  
    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: 'user_id', message, latitude, longitude, location })
      });
  
      if (response.ok) {
        alert('Leave request submitted successfully');
        document.getElementById('leaveMessage').value = '';
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit leave request');
    }
  });
  