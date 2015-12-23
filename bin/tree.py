#!/usr/bin/python

from Adafruit_PWM_Servo_Driver import PWM
import pygame
import time
import json
# from pprint import pprint
import datetime


# Timelines
class Timeline:
    def __init__(self, id, events):
        self.id = id
        self.events = events
        self.latest = None
    
    def getLatest(self, time):
        if len(self.events) == 0: return False
        
        latest = self.events[0]
        
        # Skip first
        iterEvents = iter(self.events)
        next(iterEvents)
        
        for event in iterEvents:
            
            if event['time'] <= time:
                if event['time'] > latest['time']:
                    latest = event
            else:
                break
        
        if self.latest is None or self.latest['time'] != latest['time']:
            self.latest = latest
            return latest
        
        
        return False
        
timelines = []


# Set up servos
servoMin = 150 # Min pulse length out of 4096
servoMax = 600 # Max pulse length out of 4096

pwm = PWM(0x40)
pwm.setPWMFreq(60) # Set frequency to 60 Hz


# Set up the mixer
freq = 44100
bitsize = -16
channels = 2
buffer = 4096
pygame.mixer.init(freq, bitsize, channels, buffer)
# pygame.mixer.music.set_volume(1)


# Work
with open('sequence.json') as data_file:    
    data = json.load(data_file)
    pygame.mixer.music.load(data['audioUrl'])
    pygame.mixer.music.play()

for servo, events in data['events'].iteritems():
    timeline = Timeline(int(servo), events)
    timelines.append(timeline)


while True:
    while pygame.mixer.music.get_busy():
        time = pygame.mixer.music.get_pos() / 1000.0
        
        for timeline in timelines:
            latest = timeline.getLatest(time)
            
            if latest:
                pulse = (((latest['ratio'] + 100) * (servoMax - servoMin)) / 200) + servoMin
                pwm.setPWM(timeline.id, 0, pulse)

print 'Goodbye'