'use strict';

/**
 * (1) App
 * (2) Sequence
 * (3) Timeline
 * (4) EditorUI
 * (5) ServoPreviewUI
 * (6) Utils
 */

 
 
/**
 * App
 */
function App() {
    this.ws = null;
    
    this.region = null;
    this.newRegion = false;
    
    this.waveWidth = 0;
    this.resolution = 50; // px/s
    this.duration = 0;
    this.updateDelay = 100;
    
    this.sequence = null;
    this.editors = [];
    this.updateInterval = null;
    
    this.initWs();
}

App.prototype.initWs = function() {
    var self = this;
    var ws = Object.create(WaveSurfer);
    
    ws.init({
        container: $('.js-canvas-timeline')[0],
        waveColor: '#0fc2b3',
        progressColor: '#f03d4c',
        cursorColor: '#fff',
        height: 80,
        cursorWidth: 0,
        fillParent: false,
        minPxPerSec: self.resolution
    });
    
    ws.enableDragSelection({
        color: 'rgba(255,255,255,0.1)',
        loop: false
    });
    
    ws.on('ready', function() {
        self.waveWidth = $('.js-canvas-timeline > wave').width();
        self.duration = ws.getDuration();
        
        $('.js-bar-playback').show();
        $('.js-app-stage').width(self.waveWidth);
        
        self.onAudioReady();
    });
    
    ws.on('error', function(err) {
        console.error(err);
    });
    
    ws.on('audioprocess', function(e) {
        var pos = e / ws.getDuration();
        $('.js-bar-playback').css('left', pos * self.waveWidth);
    });
    
    ws.on('play', function() {
        if (self.updateInterval) clearInterval(self.updateInterval);
        self.updateInterval = setInterval(function() {
            self.checkUpdates();
        }, self.updateDelay);
    });
    
    ws.on('pause', function() {
        clearInterval(self.updateInterval);
    });
    
    ws.on('seek', function(e) {
        $('.js-bar-playback').css('left', e * self.waveWidth);
    });
    
    ws.on('finish', function(e) {
        // ws.stop();
    });
    
    ws.on('region-created', function(region) {
        self.region = region;
        self.newRegion = true;
        
        ws.clearRegions();
        ws.toggleInteraction();
        
        region.on('out', function() {
            ws.pause();
            ws.seekTo(region.start / ws.getDuration());
        });
        
        region.on('dblclick', function() {
            ws.pause();
            ws.seekTo(region.start / ws.getDuration());
        });
       
    });
            
    ws.on('region-update-end', function(region) {
        if (self.newRegion) {
            self.newRegion = false;
            
            ws.seekTo(region.start / ws.getDuration());
            
            setTimeout(function() {
                ws.toggleInteraction();
            }, 250);
        }
    });
    
    this.ws = ws;
};

App.prototype.onAudioReady = function() {
    this.initKeys();
    this.initUI();
    this.initEditors();    
};

App.prototype.initKeys = function() {
    var self = this;
    
    $(document).keydown(function(e){
        if (e.which == 32) {
            e.preventDefault();
            if (e.ctrlKey) {
                self.ws.play(self.region.start);
            } else {
                self.ws.playPause();
            }
        }
    });
};

App.prototype.initUI = function() {
    var self = this;
    
    // Cursor bar
    $('.js-app-stage')
        .hover(function() {
            $('.js-bar').show();
        }, function() {
            $('.js-bar').hide();
        })
        .mousemove(function(e) {
            var offset = $('.js-app-stage').offset();
            var pos = Math.max(0, e.pageX - offset.left);
            $('.js-bar').css('left', pos);
        });
        
    // Actions
    $('.js-action-new').click(function(e) {
        e.preventDefault();
        location.reload();
    });
    
    $('.js-action-import').click(function(e) {
        e.preventDefault();
    });
    
    $('.js-action-export').click(function(e) {
        e.preventDefault();
        window.open('json.php?json=' + encodeURIComponent(self.sequence.toJSON()));
    });
};

App.prototype.initEditors = function() {
    var self = this;

    $('.js-editor').each(function(index) {
        var id = $(this).data('servo-id');
        
        // Timeline
        var timeline = new Timeline(id);
        self.sequence.timelines.push(timeline);
        
        // Servo preview
        var servoCanvas = $('.js-servo[data-servo-id="' + id + '"] canvas')[0];
        var servo = new ServoPreviewUI(servoCanvas);
        
        // Canvas
        var editorCanvas = $(this).find('.js-canvas-editor')[0];
        var paperScope = new paper.PaperScope(); // Why...?
        
        paperScope.setup(editorCanvas);
        
        self.editors.push(new EditorUI(
            paperScope,
            timeline,
            servo,
            self.waveWidth,
            self.duration
        ));
    });
};

App.prototype.checkUpdates = function() {
    var time = this.ws.getCurrentTime();
    for (var i = 0, len = this.editors.length; i < len; i++) {
        var editor = this.editors[i];
        var timeline = editor.timeline;
        var latest = timeline.getLatest(time);
        
        if (latest) {
            editor.servo.rotateTo(latest.ratio);
        }
    }
};

App.prototype.load = function(audioUrl) {
    this.sequence = new Sequence(audioUrl);
    this.ws.load(audioUrl);
};



/**
 * Sequence
 */
function Sequence(audioUrl) {
    this.audioUrl = audioUrl;
    this.time = 0;
    
    this.timelines = [];
}

Sequence.prototype.toJSON = function() {
    var events = {};
    
    for (var i = 0; i < this.timelines.length; i++) {
        var timeline = this.timelines[i];
        events[timeline.id] = timeline.events;
    };
    
    var out = {
        audioUrl: this.audioUrl,
        events: events
    };
    return JSON.stringify(out);
};


/**
 * Timeline
 */
function Timeline(id) {
    this.id = id;
    this.events = [];
    this.latest = null;
    
    this.addEvent(0, 0);
}

Timeline.prototype.addEvent = function(time, angleRatio) {
    for (var i = 0, len = this.events.length; i < len; i++) {
        if (time == this.events[i].time) {
            return false;
        }
    }
    
    // Add event
    this.events.push({
        time: time,
        ratio: angleRatio
    });
    
    // Sort events
    this.events.sort(function(a, b) {
        return a.time - b.time;
    });
    
    console.log('Added event', time, angleRatio);
    
    return true;
}

Timeline.prototype.removeEvent = function(time) {
    for (var i = 0, len = this.events.length; i < len; i++) {
        if (time == this.events[i].time) {
            this.events.splice(i, 1);
            return true;
        }
    }
    
    return false;
}

Timeline.prototype.getLatest = function(time) {
    if (this.events.length == 0) return false;
    
    var latest = this.events[0];
    
    for (var i = 1, len = this.events.length; i < len; i++) {
        var event = this.events[i];
        if (event.time <= time) {
            if (event.time > latest.time) {
                latest = event;
            }
        } else {
            break;
        }
    }
    
    if (!this.latest || this.latest.time != latest.time) { // TODO: Latest is wrong between replays
        this.latest = latest;
        return latest;
    }
    
    return false;
};



/**
 * EditorUI
 */
function EditorUI(scope, timeline, servo, width, duration) {
    this.scope = scope;
    this.view = this.scope.view;
    this.canvas = this.scope.view.element;
    this.project = this.scope.project
    
    this.timeline = timeline;
    this.servo = servo;
    
    this.height = 60;
    this.width = width;
    this.duration = duration;
    
    this.cursor = null;
    
    this.initCursor();
    this.initInteraction();
    this.initEvents();
}

EditorUI.prototype.initEvents = function() {
    var self = this;
    
    $(this.canvas).hover(function() {
        self.cursor.visible = true;
        self.view.update();
    }, function() {
        self.cursor.visible = false;
        self.view.update();
    });
};

EditorUI.prototype.initCursor = function() {
    var self = this;
    
    this.cursor = new paper.Path.Rectangle({
        point: [0, 0],
        size: [10, 5],
        fillColor: '#666',
    });
    
    this.cursor.visible = false;
    
    var tool = new paper.Tool();
    tool.onMouseMove = function (e) {
        self.cursor.position = self.getSnappedPoint(e.point);
    };
};


EditorUI.prototype.initInteraction = function() {
    var self = this;
    
    var bg = new paper.Path.Rectangle({
        point: [0, 0],
        size: [self.width, self.height],
        fillColor: 'rgba(0, 0, 0, 0)'
    });
    
    bg.onMouseDown = function(e) {
        var point = self.getSnappedPoint(e.point);
        
        if (point.y <= 0 || point.y >= self.height) { // Out of bounds
            return;
        }
        
        var eventRect = new paper.Path.Rectangle({
            point: [0, 0],
            size: [10.5, 5.5],
            fillColor: '#fff',
            strokeColor: '#f00'
        });
        
        eventRect.position = new paper.Point(point.x + 0.5, point.y);
        
        eventRect.onMouseEnter = function() {
            eventRect.strokeWidth = 2;
            eventRect.bringToFront();
        };
        
        eventRect.onMouseLeave = function() {
            eventRect.strokeWidth = 0;
        };
        
        eventRect.onMouseDown = function() {
            self.timeline.removeEvent(self.pxToTime(point.x));
            eventRect.remove();
        }
        
        var angleRatio = -100 + ((point.y / 5) - 1) * 20; // Get servo ratio
        if (!self.timeline.addEvent(self.pxToTime(point.x), angleRatio)) {
            eventRect.remove();
        }
        
        self.view.update();
    };
    
    self.view.update();
};

EditorUI.prototype.getSnappedPoint = function(point) {
    var x = (10 * (Math.round(point.x / 10)));
    var y = (5 * (Math.round(point.y / 5)));
    return new paper.Point(x, y);
};

EditorUI.prototype.pxToTime = function(pos) {
    return (pos / this.width) * this.duration;
}



/**
 * ServoPreviewUI
 */
function ServoPreviewUI(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.ctx.beginPath();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    
    this.armLength = 19;
    this.minAngle = -90;
    this.maxAngle = 90;
    this.speed = 20; // deg/s
    
    this.targetAngle = 0;
    this.angle = 0;
    
    // Loop
    this.last = window.performance.now();
    this.draw();    
}

ServoPreviewUI.prototype.rotateTo = function(ratio) {
    var angle = 0;
    
    if (ratio > 0) {
        angle = ratio / 100 * Math.abs(this.maxAngle);
    } else if (ratio < 0) {
        angle = ratio / 100 * Math.abs(this.minAngle);
    }
    
    this.targetAngle = angle;
    // this.draw();
}

ServoPreviewUI.prototype.draw = function() {
    this.clear();
    
    var self = this;
    var now = window.performance.now();
    var dt = (now - this.last) / 1000;
    
    this.angle += (this.targetAngle - this.angle) * (this.speed * dt);
    
    var ctx = this.ctx;
    var x = 30 + this.armLength * Math.cos(Math.radians(this.angle));
    var y = 30 + this.armLength * Math.sin(Math.radians(this.angle));
    
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    
    this.last = now;
    
    requestAnimationFrame(function() {
        self.draw();
    });
};

ServoPreviewUI.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

ServoPreviewUI.prototype.ease = function(t, b, c, d) {
    return c * t / d + b;
}


/**
 * Utils
 */
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
};

Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};