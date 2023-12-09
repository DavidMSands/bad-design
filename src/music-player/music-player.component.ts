import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, Renderer2, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

@Component({
  selector: 'music-player',
  templateUrl: './music-player.component.html',
  styleUrl: './music-player.component.css'
})
export class MusicPlayerComponent implements OnInit, OnDestroy {
    @ViewChild('audioPlayer') audioPlayer!: ElementRef;
    http = inject(HttpClient)
    renderer = inject(Renderer2);
    cdr = inject(ChangeDetectorRef)
    audioDuration: number = 0;
    isPlaying: boolean = false;
    isMuted: boolean = false;
    progressInterval: any;
    currentArrowButton: string | null = null;
    arrowButtons: string[] = ['play', 'pause', 'mute', 'unmute'];
    lastRandomIndex: number | null = null;
    showCaptchaBox = false;
    triviaQuestions: any[] = [];
    currentQuestion: any = null;
    timer: number = 5;
    intervalId: any;
    showForm = false;
    showWrongAnswerImage = false;
    ambientValue: number = 0;
    quality: number = 0;
    distance: number = 0;
    mood: number = 0;
    calculatedValue: number = 0;
    cursors: any[] = [];
    mouseMove = new Subject<MouseEvent>();
    unsubscribe = new Subject<void>();
    private mouseMoveListener: Function | null = null;
  
    ngOnInit() {
        this.loadTriviaQuestions();
        this.startArrowMovement();
        document.addEventListener('keydown', this.handleSpacebarPress.bind(this));
    }

    ngAfterViewInit() {
        const audio: HTMLAudioElement = this.audioPlayer.nativeElement;
      audio.addEventListener('durationchange', () => {
        this.audioDuration = audio.duration;
      });
      audio.addEventListener('ended', () => {
        this.isPlaying = false;
        clearInterval(this.progressInterval);
      });
      audio.addEventListener('timeupdate', () => {
        if (!audio.seeking) {
          // Update progress slider value
          const progressSlider = document.querySelector('.progress-slider') as HTMLInputElement;
          progressSlider.value = audio.currentTime.toString();
        }
      });
    }

    // onFormSubmit() {
    //     let ambientEffect = Math.sin(this.ambientValue / 10);
    //     let qualityEffect = Math.cos(this.quality / 2);
    //     let distanceEffect = 1 - Math.exp(-this.distance);
    //     let moodEffect = 1 + Math.tanh(this.mood);

    //     this.calculatedValue = (ambientEffect + qualityEffect) / 2 * distanceEffect * moodEffect;
    //     this.calculatedValue = Math.min(Math.max(this.calculatedValue, 0), 1);
    //     this.setVolume();
    //     this.showForm = false;
    // }

    toggleCaptchaBox() {
        if(!this.currentQuestion && !this.showForm && !this.showWrongAnswerImage) {
        this.showCaptchaBox = !this.showCaptchaBox;
        }
    }

    loadTriviaQuestions() {
        this.http.get<any[]>('assets/trivia.json').subscribe(data => {
            this.triviaQuestions = data;
        }); 
    }

    onCheckboxChange() {
        this.showCaptchaBox = false;
        this.selectRandomQuestion();
        this.startCountdown();
    }

    selectRandomQuestion() {
        const randomIndex = Math.floor(Math.random() * this.triviaQuestions.length);
        this.currentQuestion = this.triviaQuestions[randomIndex];
    }

    startCountdown() {
        this.timer = 5;
        this.intervalId = setInterval(() => {
          if (this.timer > 0) {
            this.timer--;
          } else {
            this.stopCountdown();
            this.currentQuestion = false;
            this.showForm = false;
            document.documentElement.style.cursor = 'auto';
            this.removeMouseMoveListener();
          }
        }, 1000);
      }

      removeMouseMoveListener() {
        if (this.mouseMoveListener) {
          this.mouseMoveListener(); 
          this.mouseMoveListener = null;
        }
      }
    
      stopCountdown() {
        if (this.intervalId) {
          clearInterval(this.intervalId);
        }
      }

      volumeCursor() {
        document.documentElement.style.cursor = 'none';
        this.cdr.detectChanges();
        this.cursors.push({ offsetX: 0, offsetY: 0, delay: 0 });

        for (let i = 0; i < 60; i++) {
            this.cursors.push({
              offsetX: (Math.random() - 0.5) * 250,
              offsetY: (Math.random() - 0.5) * 250,
              delay: i * 15
            });
            this.mouseMoveListener = this.renderer.listen('document', 'mousemove', (event: MouseEvent) => {
                this.mouseMove.next(event);
            });

            this.mouseMove.pipe(
                throttleTime(500),
              ).subscribe(event => {
                this.updateCursorPositions(event);
            });
          }
      }

      updateCursorPositions(event: MouseEvent): void {
        this.cursors.forEach(cursor => {
          setTimeout(() => {
            cursor.x = event.pageX + cursor.offsetX;
            cursor.y = event.pageY + cursor.offsetY;
          }, cursor.delay);
        });
      }

      checkAnswer(selectedOption: string) {
        if (selectedOption === this.currentQuestion.answer) {
            this.showForm = true;
            this.currentQuestion = null;
            this.volumeCursor();
            this.timer = 5;
        } else {
            this.showWrongAnswerImage = true;
            this.currentQuestion = null;
            setTimeout(() => {
                this.showWrongAnswerImage = false;
            }, 5000);
        }
    }

    startArrowMovement() {
        setInterval(() => {
        this.arrowButtons.forEach(button => {
          const arrowElement = document.querySelector(`.arrow-${button}`) as HTMLElement;
          arrowElement?.classList.remove('visible');
        });
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * this.arrowButtons.length);
        } while (randomIndex === this.lastRandomIndex);

        this.lastRandomIndex = randomIndex;
        this.currentArrowButton = this.arrowButtons[randomIndex];
        const currentArrowElement = document.querySelector(`.arrow-${this.currentArrowButton}`) as HTMLElement;
        currentArrowElement?.classList.add('visible');
        }, 300);
      }
    
      handleSpacebarPress(event: KeyboardEvent) {
        if (event.key === ' ') {
          this.triggerButtonAction(this.currentArrowButton);
        }
      }
    
      triggerButtonAction(buttonType: string | null) {
        switch (buttonType) {
          case 'play':
            this.onPlay();
            break;
          case 'pause':
            this.onPause();
            break;
          case 'mute':
            this.onMute();
            break;
          case 'unmute':
            this.onUnmute();
            break;
          // Add cases for other buttons
          default:
            break;
        }
      }

    onPlay() {
      const audio: HTMLAudioElement = this.audioPlayer.nativeElement;
      audio.play();
      this.trackProgress();
    }

    onPause() {
        const audio: HTMLAudioElement = this.audioPlayer.nativeElement;
        audio.pause();
        this.trackProgress();
    }

    onMute() {
      const audio: HTMLAudioElement = this.audioPlayer.nativeElement;
      audio.muted = true;
    }

    onUnmute() {
      const audio: HTMLAudioElement = this.audioPlayer.nativeElement;
      audio.muted = false;
    }
  
    setVolume(event: any) {
        const audio: HTMLAudioElement = this.audioPlayer.nativeElement;
        audio.volume = parseFloat(event.target.value);
      }
  
    seek(event: any) {
        const audio: HTMLAudioElement = this.audioPlayer.nativeElement;
        audio.currentTime = parseFloat(event.target.value);
      }
    
    trackProgress() {
        const audio: HTMLAudioElement = this.audioPlayer.nativeElement;
        this.progressInterval = setInterval(() => {
          const progressSlider = document.querySelector('.progress-slider') as HTMLInputElement;
          progressSlider.max = this.audioDuration.toString();
          progressSlider.value = audio.currentTime.toString();
        }, 1000);
      }

    ngOnDestroy() {
        clearInterval(this.progressInterval);
        document.removeEventListener('keydown', this.handleSpacebarPress.bind(this));
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
  }
