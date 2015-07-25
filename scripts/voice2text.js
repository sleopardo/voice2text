;(function(exports){

    'use strict';

    // Private Properties & Methods
    var recognition,
        triggerSelected,
        targetSelected,
        final_transcript = '',
        flag_recognizing = false,
        ignore_onend,
        start_timestamp,
        defaults = {
            lang: 'es-AR',
            continuous: true,
            interimResults: true,
            trigger: null
        };

    function capitalize(string) {
        return string.replace(/\S/, function(firstLetter) {
            return firstLetter.toUpperCase();
        });
    }

    function extend(props, obj) {
        for (var prop in props) {
            if(props.hasOwnProperty(prop)) {
                obj[prop] = props[prop];
            }
        }

        return obj;
    }

    /**
     * Constructor
     */
    function VoiceControl (conf) {
        this.conf = extend(conf, defaults);

        if (!this.conf.trigger) {
            throw new Error('Trigger must be specified.');
        }

        if (typeof VoiceControl.Instance === 'object') {
            return VoiceControl.Instance;
        }

        if ('webkitSpeechRecognition' in window) {
            this.setRecognition();
            this.bindEvents();
        }

        VoiceControl.Instance = this;

        return this;
    }


    VoiceControl.prototype.setRecognition = function () {
        var that = this,
            trigger = document.querySelectorAll(this.conf.trigger),
            i = 0,
            triggerLength = trigger.length;

        for (i; i < triggerLength; i += 1){
            trigger[i].style.display = 'inline-block';
        }

        recognition = new webkitSpeechRecognition();
        recognition.continuous = this.conf.continuous;
        recognition.interimResults = this.conf.interimResults;

        recognition.onstart = function() {
            flag_recognizing = true;
        };

        recognition.onerror = function(event) {
            // TODO: QUITAR
            triggerSelected.style.background = 'none';

            if (event.error === 'no-speech') {
                console.log('No se detecto ningun dictado');
                ignore_onend = true;
            }

            if (event.error === 'audio-capture') {
                console.log('No se detecto microfono');
                ignore_onend = true;
            }

            if (event.error === 'not-allowed') {
                if (event.timeStamp - start_timestamp < 100) {
                    console.log('Los permisos del mic estan bloqueados');
                } else {
                    console.log('se denego el permiso al mic');
                }
                ignore_onend = true;
            }
        };

        recognition.onend = function() {
            flag_recognizing = false;
            if (ignore_onend) { return; }
            if (final_transcript) {
                // Podria avisar que para terminar toque en el icono
            }
        };

        recognition.onresult = function(event) {
            var interim_transcript = '',
                results = event.results,
                resultsLength = results.length,
                i = event.resultIndex;

            for (i; i < resultsLength; i += 1) {
                if (results[i].isFinal) {
                    final_transcript += results[i][0].transcript + '.';
                    targetSelected.innerHTML = capitalize(final_transcript);
                } else {
                    interim_transcript += results[i][0].transcript;
                    targetSelected.innerHTML = capitalize(final_transcript + interim_transcript);
                }
            }
        };

        return this;
    };


    VoiceControl.prototype.startRecognition = function (event) {
        final_transcript = '';

        // El Browser pide autorizacion
        if (flag_recognizing) {
            recognition.stop();
            return;
        }

        recognition.lang = this.conf.lang;

        ignore_onend = false;
        targetSelected.innerHTML = '';
        start_timestamp = event.timeStamp;
        recognition.start();

        return this;
    };


    VoiceControl.prototype.bindEvents = function () {
        var that = this;

        document.body.addEventListener('click', function (event) {
            if (event.target.getAttribute('data-js') === 'voicecontrol') {
                event.preventDefault();
                triggerSelected = event.target;
                targetSelected = document.querySelector('[data-voicecontrol-target="' + triggerSelected.getAttribute('data-voicecontrol-for') + '"]');
                that.startRecognition(event);
            }
        });

        return this;
    };

    exports.VoiceControl = VoiceControl;

}(this));