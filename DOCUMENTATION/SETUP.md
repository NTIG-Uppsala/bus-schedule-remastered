# Setup
To set up the project for development:
- Clone this repository
- Make sure you have Node.js and npm installed
- Run `npm install` in your project folder
- \[Optional\] Install the ESLint extension if you're using VSCode
- To run the project you need a `.env` file placed in the project root, with the following content:
    - `STATIC_API_KEY="{API_KEY}"`, where `{API_KEY}` is your Trafiklab project's API key (see [API_INFORMATION.md](API_INFORMATION.md) for more info)
      - For example `STATIC_API_KEY="1234567890"`
- For testing you need a gtfs zip file at `./data/testdata.zip`. If the tests stop working you can update it by running `download_test_data.bat`.
You also might want an cypress account linked to the project track the testing.


# RaspberryPi Setup
1. Download the Raspberry Pi imager and insert your SD card into you computer.  [Imager Download](https://www.raspberrypi.com/software/)
2. Choose the version of Pi you have, choose an operating system and then configure your storage.
3. Configure the settings to your liking with passwords and internet connection and make sure to enable SSH.
4. Once the configuration is done according to the imager programme, put your SD card in the Raspberry Pi and connect the Pi to your devices. (Screen, keyboard, etc.)
5. Open the terminal and enter 'ifconfig'.
6. Check the IP of your Pi and make sure you remember it.
7. When you are on the same internet connection as the Pi. To connect to the Pi, open the terminal on your computer and enter 'SSH yourhostname@yourIPAdress'. It will then ask for a password, enter it. The standard hostname for your Pi will be "Pi" Unless you chose something else. Example prompt: 'SSH pi@192.168.x.x'.
8. Enter 'mkdir git' to make a new folder for the github repository.
9. Enter 'cd git' to enter the repo.
10. Enter 'git clone https://github.com/NTIG-Uppsala/bus-schedule-remastered.git'.
11. Enter 'cd bus-schedule-remastered'.
12. Enter 'cd ../..' to go back to home directory.
13. Download Node by following this guide. [Node Guide](https://pimylifeup.com/raspberry-pi-nodejs/)
14. Enter 'cd git/bus-schedule-remastered/' in the terminal to go back to the repo.
15. Enter 'npm install' to download all node modules and assets.
16. Go back to the home directory by entering 'cd ../..' and enter 'cd /etc/xdg/lxsession/LXDE-pi'.
17. Now enter 'sudo unlink autostart' and then 'sudo ln -s /home/hostname/git/bus-schedule-remastered/RaspberryPi/autostart autostart'
18. You should now have come as far as the current version of the software allows you.
