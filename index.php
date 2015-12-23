<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sequencer</title>
    <link rel="shortcut icon" href="favicon.png">
    <link rel="stylesheet" href="css/style.css">
    <script src="libs/jquery.min.js"></script>
    <script src="libs/mustache.min.js"></script>
    <script src="libs/paper/paper-full.min.js"></script>
    <script src="libs/wavesurfer/wavesurfer.min.js"></script>
    <script src="libs/wavesurfer/plugins/wavesurfer.regions.min.js"></script>
</head>
<body>
    <header class="seq-header">
        <div class="seq-header__logo">Servo Sequencer</div>
        <div class="seq-header__group">
            <a class="seq-header__btn js-action-new" href="#">New project</a>
            <a class="seq-header__btn js-action-import" href="#">Import</a>
            <a class="seq-header__btn js-action-export" href="#" target="_blank">Export</a>
        </div>
        <!--
        <div class="seq-header__group">
            <a class="seq-header__btn" href="#">Audio settings</a>
        </div>
        -->
        <div class="seq-header__group">
            <div class="" style="float:left; font-size:12px; margin-left:10px;line-height:1.7;">Mariah Carey - <span style="font-weight:bold; font-style:italic;">All I Want For Christmas Is You</span></b></div>
        </div>
        <div class="seq-header__group">
            <?php
            $sth = array(
                'action' => 'play',
                'params' => json_encode(array(
                    'sequence' => 'http://tree.episode17.com/sequencer/projects/sequence.json'
                ))
            );
            ?>
            <a class="seq-header__btn seq-header__btn--dev" href="hw-proxy.php?<?=http_build_query($sth);?>" target="_blank">Send to hardware</a>
        </div>
    </header>
    <div class="seq-app">
        <div class="seq-app__side">
            <div class="seq-tools">
            </div>
            <?php for ($i = 0; $i < 15; $i++) { ?>
            <div class="seq-row">
                <div class="seq-servo js-servo" data-servo-id="<?=$i;?>">
                    <div class="seq-servo__label">Servo <?=$i;?></div>
                    <div class="seq-servo__preview">
                        <canvas class="js-canvas-preview" width="60" height="60"></canvas>
                    </div>
                </div>
            </div>
            <?php } ?>
        </div>
        <div class="seq-app__stage-wrapper">
            <div class="seq-app__stage js-app-stage">
                <div class="seq-timeline">
                    <div class="js-canvas-timeline"></div>
                </div>
                <?php for ($i = 0; $i < 15; $i++) { ?>
                <div class="seq-row">
                    <div class="seq-editor js-editor" data-servo-id="<?=$i;?>">
                        <canvas class="js-canvas-editor" resize></canvas>
                    </div>
                </div>
                <?php } ?>
                <div class="seq-bar js-bar"></div>
                <div class="seq-bar seq-bar--playback js-bar-playback"></div>
            </div>
        </div>
    </div>
    <script src="js/app.js"></script>
    <script>   
        $(function() {
            window.app = new App();
            app.load('music/song.mp3');
        });
    </script>
</body>
</html>