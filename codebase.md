# .gitignore

```
node_modules/*
package-lock.json
```

# game.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R Arena - Game</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            margin: 0;
            position: relative;
            overflow-x: hidden;
        }

        /* Interactive Statistical Background - Same as welcome page */
        .stats-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.3;
        }

        .stats-canvas {
            width: 100%;
            height: 100%;
        }

        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            box-shadow: 
                0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04),
                0 0 0 1px rgba(255, 255, 255, 0.5);
            padding: 32px;
            max-width: 920px;
            width: 100%;
            border: 1px solid rgba(0,0,0,0.05);
            position: relative;
            z-index: 1;
            animation: slideIn 0.6s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            animation: fadeInDown 0.8s ease-out 0.2s both;
        }

        .header h1 {
            color: #1a1a1a;
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #000 0%, #4a5568 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header p {
            color: #666;
            font-size: 0.95rem;
            font-weight: 400;
            margin: 4px 0;
            transition: color 0.3s ease;
        }

        .chart-container {
            position: relative;
            height: 500px;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #fdfdfd 0%, #f9f9f9 100%);
            border-radius: 16px;
            border: 1px solid #e5e7eb;
            cursor: crosshair;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
            animation: fadeIn 1s ease-out 0.4s both;
            transition: all 0.3s ease;
        }

        .chart-container:hover {
            box-shadow: 
                inset 0 2px 4px rgba(0,0,0,0.06),
                0 4px 12px rgba(0,0,0,0.1);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .legend {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }

        .legend-item:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 1px solid rgba(0,0,0,0.1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .legend-color.original {
            background-color: rgba(0, 0, 0, 0.8);
        }

        .legend-color.mine {
            background-color: rgba(255, 0, 0, 0.8);
        }

        .legend-color.partner {
            background-color: rgba(0, 255, 0, 0.8);
        }

        .instructions {
            background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            color: #495057;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            animation: fadeInUp 0.8s ease-out 0.8s both;
            transition: all 0.3s ease;
        }

        .instructions:hover {
            background: linear-gradient(135deg, #f1f3f4 0%, #e9ecef 100%);
        }

        #guessSection {
            margin-bottom: 15px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        #correlationGuess {
            width: 120px;
            padding: 10px 14px;
            margin: 0 10px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            text-align: center;
            transition: all 0.2s ease;
            background: #ffffff;
            font-weight: 500;
            appearance: none;
            -moz-appearance: textfield;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* Remove arrows from number input */
        #correlationGuess::-webkit-outer-spin-button,
        #correlationGuess::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        #correlationGuess:hover {
            border-color: #cbd5e1;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        #correlationGuess:focus {
            outline: none;
            border-color: #64748b;
            box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.15);
        }

        #correlationGuess.typing {
            animation: typing 0.3s ease-out;
        }

        @keyframes typing {
            0% {
                border-color: #64748b;
            }
            50% {
                border-color: #475569;
            }
            100% {
                border-color: #64748b;
            }
        }

        /* Green styling for positive values */
        #correlationGuess.positive {
            border-color: #10b981;
            background: #f0fdf4;
            color: #047857;
        }

        #correlationGuess.positive:hover {
            border-color: #059669;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
        }

        #correlationGuess.positive:focus {
            border-color: #059669;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        /* Red styling for negative/zero values */
        #correlationGuess.negative {
            border-color: #ef4444;
            background: #fef2f2;
            color: #dc2626;
        }

        #correlationGuess.negative:hover {
            border-color: #dc2626;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
        }

        #correlationGuess.negative:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        /* Invalid input styling */
        #correlationGuess.invalid {
            border-color: #f59e0b;
            background: #fffbeb;
            color: #d97706;
        }

        #correlationGuess.invalid:hover {
            border-color: #d97706;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
        }

        #correlationGuess.invalid:focus {
            border-color: #d97706;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }

        #correlationGuess.submitting {
            animation: submitPulse 0.4s ease-out;
            background: #10b981;
            color: white;
            border-color: #047857;
        }

        @keyframes submitPulse {
            0% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
            }
            50% {
                transform: scale(1.02);
                box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2);
            }
            100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
        }

        #correlationGuess:disabled {
            background: #f1f5f9;
            color: #9ca3af;
            border-color: #d1d5db;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .mode-btn {
            margin: 0 4px;
            padding: 10px 18px;
            font-size: 13px;
            border-radius: 8px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
            position: relative;
            overflow: hidden;
        }

        .mode-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }

        .mode-btn:hover::before {
            left: 100%;
        }

        .mode-btn.active {
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transform: translateY(-2px);
        }

        .mode-btn.active:hover {
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .mode-btn.secondary {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            color: white;
        }

        .mode-btn.secondary:hover {
            background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        }

        #submitGuessBtn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }

        #submitGuessBtn:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        #modeToggle {
            margin-bottom: 10px;
            animation: slideIn 0.5s ease-out 1s both;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        #instructionText {
            font-size: 0.95rem;
            line-height: 1.5;
            animation: fadeIn 0.8s ease-out 1.2s both;
        }

        /* Turn indicator animations */
        #turnInfo {
            transition: all 0.4s ease;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 600;
        }

        #timerDisplay {
            transition: all 0.3s ease;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 600;
        }

        #timerDisplay.warning {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            animation: timerPulse 1s infinite;
        }

        @keyframes timerPulse {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
            }
            50% {
                box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
            }
        }

        /* Timer bar styles */
        .timer-bar-container {
            position: fixed;
            top: 0;
            left: 20px;
            width: 8px;
            height: 100vh;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            overflow: hidden;
            z-index: 1000;
            backdrop-filter: blur(10px);
            display: none;
            box-sizing: border-box;
        }

        .timer-bar {
            width: 100%;
            background: linear-gradient(to top, #10b981 0%, #34d399 50%, #6ee7b7 100%);
            border-radius: 3px;
            transition: height 1s linear, background 0.3s ease;
            height: 100%;
            transform-origin: bottom;
        }

        .timer-bar.warning {
            background: linear-gradient(to top, #ef4444 0%, #f87171 50%, #fca5a5 100%);
            animation: barPulse 0.5s infinite alternate;
        }

        @keyframes barPulse {
            0% {
                opacity: 1;
                box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
            }
            100% {
                opacity: 0.8;
                box-shadow: 0 0 8px 2px rgba(239, 68, 68, 0.6);
            }
        }

        #turnInfo.my-turn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            animation: pulse 2s infinite;
        }

        #turnInfo.partner-turn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
        }

        @keyframes pulse {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
            }
            50% {
                box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
            }
        }

        /* Point addition effect */
        .point-added {
            animation: pointPop 0.6s ease-out;
        }

        @keyframes pointPop {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.3);
                opacity: 0.8;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        @media (max-width: 768px) {
            .container {
                padding: 24px;
                margin: 0 16px;
            }

            .header h1 {
                font-size: 1.75rem;
            }

            .header p {
                font-size: 0.85rem;
            }

            .chart-container {
                height: 400px;
            }

            .legend {
                flex-wrap: wrap;
                gap: 12px;
            }

            .legend-item {
                font-size: 0.9rem;
            }

            .mode-btn {
                font-size: 12px;
                padding: 8px 14px;
            }

            #correlationGuess {
                width: 100px;
                margin: 5px;
            }
        }

        /* Loading states */
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 16px;
            backdrop-filter: blur(5px);
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #000;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Notification styles */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
            z-index: 1000;
            font-weight: 500;
            font-size: 0.95rem;
            min-width: 300px;
            animation: slideInRight 0.5s ease-out;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .notification.reconnecting {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
        }

        .notification.reconnected {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
        }

        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .notification-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }

        .notification-icon.warning {
            background: rgba(255, 255, 255, 0.2);
        }

        .notification-icon.reconnecting {
            background: rgba(255, 255, 255, 0.2);
            animation: spin 1s linear infinite;
        }

        .notification-icon.success {
            background: rgba(255, 255, 255, 0.2);
        }

        .notification-countdown {
            font-size: 0.85rem;
            opacity: 0.9;
            margin-top: 4px;
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }

        /* Game Result Window */
        .game-result-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease-out;
        }

        .game-result-window {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            box-shadow: 
                0 25px 50px rgba(0, 0, 0, 0.25),
                0 0 0 1px rgba(255, 255, 255, 0.8);
            animation: scaleIn 0.4s ease-out 0.1s both;
            border: 2px solid rgba(255, 255, 255, 0.9);
        }

        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.8) translateY(20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        .result-title {
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 16px;
            letter-spacing: -0.02em;
        }

        .result-title.win {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .result-title.lose {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .result-subtitle {
            color: #6b7280;
            font-size: 1.1rem;
            margin-bottom: 30px;
            font-weight: 500;
        }

        .score-container {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .score-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 12px 0;
            font-size: 1rem;
            min-height: 40px;
        }

        .score-label {
            color: #4b5563;
            font-weight: 500;
            flex: 1;
        }

        .score-value-container {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex: 1;
            min-width: 140px;
        }

        .score-value {
            color: #1f2937;
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .winner-badge {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-left: 12px;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            white-space: nowrap;
        }

        .result-actions {
            margin-top: 32px;
            display: flex;
            gap: 16px;
            justify-content: center;
        }

        .result-btn {
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1rem;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 120px;
        }

        .result-btn.primary {
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .result-btn.primary:hover {
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .result-btn.secondary {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            color: #374151;
            border: 2px solid #d1d5db;
        }

        .result-btn.secondary:hover {
            background: linear-gradient(135deg, #e2e8f0 0%, #d1d5db 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <div class="stats-background">
        <canvas class="stats-canvas" id="statsCanvas"></canvas>
    </div>

    <div class="timer-bar-container" id="timerBarContainer">
        <div class="timer-bar" id="timerBar"></div>
    </div>

    <div class="container">
        <div class="header">
            <h1>R Arena</h1>
            <p>Room: <span id="roomId">-</span> | Players: <span id="playerCount">-</span></p>
            <p><span id="turnInfo">-</span> | Round: <span id="roundInfo">-</span></strong></p>
            <p><strong>Points left: <span id="pointsLeft">-</span> | Time: <span id="timerDisplay">-</span></strong></p>
        </div>

        <div class="instructions">
            <div id="guessSection" style="display: none;">
                <label for="correlationGuess">Guess the correlation (-1 to 1): </label>
                <input type="number" id="correlationGuess" min="-1" max="1" step="0.01">
                <button id="submitGuessBtn" onclick="submitGuess()">Submit Guess</button>
            </div>
            <div id="modeToggle">
                <button id="addModeBtn" class="mode-btn active" onclick="setMode('add')">Add Points</button>
                <button id="removeModeBtn" class="mode-btn secondary" onclick="setMode('remove')">Remove Points</button>
            </div>
            
        </div>

        <div class="legend">
            <div class="legend-item">
                <div class="legend-color original"></div>
                <span>Original Points</span>
            </div>
            <div class="legend-item">
                <div class="legend-color mine"></div>
                <span>My Points</span>
            </div>
            <div class="legend-item">
                <div class="legend-color partner"></div>
                <span>Opponent Points</span>
            </div>
        </div>

        <div class="chart-container">
            <canvas id="scatterChart"></canvas>
        </div>
    </div>

    <script>
        // Interactive Statistical Background - Same as welcome page
        class StatisticalBackground {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.points = [];
                this.correlationLines = [];
                this.mouseX = 0;
                this.mouseY = 0;
                this.time = 0;
                
                this.resize();
                this.generatePoints();
                this.setupEventListeners();
                this.animate();
            }

            resize() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                this.width = this.canvas.width;
                this.height = this.canvas.height;
            }

            generatePoints() {
                this.points = [];
                const numPoints = Math.min(40, Math.floor(this.width * this.height / 20000)); // Fewer points for game page
                
                // Generate correlated data points
                for (let i = 0; i < numPoints; i++) {
                    const correlation = Math.sin(i * 0.15) * 0.6; // Less intense correlation
                    const x = Math.random() * this.width;
                    const baseY = this.height * 0.5 + (x - this.width * 0.5) * correlation * 0.2;
                    const y = baseY + (Math.random() - 0.5) * 80;
                    
                    this.points.push({
                        x: x,
                        y: Math.max(50, Math.min(this.height - 50, y)),
                        originalX: x,
                        originalY: y,
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3,
                        size: Math.random() * 2 + 1,
                        opacity: Math.random() * 0.4 + 0.1,
                        correlation: correlation,
                        phase: Math.random() * Math.PI * 2
                    });
                }
            }

            setupEventListeners() {
                window.addEventListener('resize', () => {
                    this.resize();
                    this.generatePoints();
                });
                
                document.addEventListener('mousemove', (e) => {
                    this.mouseX = e.clientX;
                    this.mouseY = e.clientY;
                });
            }

            drawGrid() {
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
                this.ctx.lineWidth = 1;
                
                // Vertical lines
                for (let x = 0; x < this.width; x += 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, 0);
                    this.ctx.lineTo(x, this.height);
                    this.ctx.stroke();
                }
                
                // Horizontal lines
                for (let y = 0; y < this.height; y += 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, y);
                    this.ctx.lineTo(this.width, y);
                    this.ctx.stroke();
                }
            }

            drawCorrelationLines() {
                // Draw subtle correlation lines
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
                this.ctx.lineWidth = 1;
                
                const numLines = 2;
                for (let i = 0; i < numLines; i++) {
                    const correlation = Math.sin(this.time * 0.0008 + i * 3) * 0.5;
                    const startX = this.width * 0.2;
                    const endX = this.width * 0.8;
                    const centerY = this.height * 0.5;
                    const startY = centerY - (endX - startX) * correlation * 0.2;
                    const endY = centerY + (endX - startX) * correlation * 0.2;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.stroke();
                }
            }

            drawPoints() {
                this.points.forEach(point => {
                    // Mouse interaction (more subtle)
                    const dx = this.mouseX - point.x;
                    const dy = this.mouseY - point.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const mouseInfluence = Math.max(0, 1 - distance / 300);
                    
                    // Update position with correlation and mouse influence
                    point.vx += Math.sin(this.time * 0.0008 + point.phase) * 0.01;
                    point.vy += Math.cos(this.time * 0.0008 + point.phase) * 0.01;
                    
                    // Subtle mouse interaction
                    if (mouseInfluence > 0) {
                        const force = mouseInfluence * 0.2;
                        point.vx += (dx / distance) * force * 0.05;
                        point.vy += (dy / distance) * force * 0.05;
                    }
                    
                    // Apply velocity with damping
                    point.x += point.vx;
                    point.y += point.vy;
                    point.vx *= 0.99;
                    point.vy *= 0.99;
                    
                    // Boundary constraints
                    if (point.x < 0 || point.x > this.width) point.vx *= -0.5;
                    if (point.y < 0 || point.y > this.height) point.vy *= -0.5;
                    point.x = Math.max(0, Math.min(this.width, point.x));
                    point.y = Math.max(0, Math.min(this.height, point.y));
                    
                    // Draw point
                    const alpha = point.opacity * (0.3 + mouseInfluence * 0.3);
                    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }

            animate() {
                this.time = Date.now();
                
                this.ctx.clearRect(0, 0, this.width, this.height);
                
                this.drawGrid();
                this.drawCorrelationLines();
                this.drawPoints();
                
                requestAnimationFrame(() => this.animate());
            }
        }

        // Initialize background
        const statsCanvas = document.getElementById('statsCanvas');
        if (statsCanvas) {
            const background = new StatisticalBackground(statsCanvas);
        }

        // Original game code
        const initialPoints = 10;
        let initialData = [];
        let addedData = [];
        let chart;
        let socket;
        let roomId;
        let targetCorrelation;
        let myPlayerIndex = -1;
        let currentTurn = 0;
        let pointsInCurrentTurn = 0;
        let maxPointsPerTurn = 3;
        let currentMode = 'add';
        let currentRound = 1;
        let maxRounds = 3;
        let gamePhase = 'guess';
        let userGuesses = [];
        let hasSubmittedGuess = false;
        let disconnectNotification = null;
        let reconnectTimer = null;
        let countdownInterval = null;
        let timeToRedirect = 30; // seconds
        let turnTimer = null;
        let turnTimeLeft = 20; // 20 seconds per turn
        let timerDisplay = null;

        // Notification system
        function showNotification(type, title, message, countdown = false) {
            // Remove existing notification
            hideNotification();
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            
            let iconSymbol = '⚠️';
            let iconClass = 'warning';
            
            if (type === 'reconnecting') {
                iconSymbol = '↻';
                iconClass = 'reconnecting';
            } else if (type === 'reconnected') {
                iconSymbol = '✓';
                iconClass = 'success';
            }
            
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon ${iconClass}">${iconSymbol}</div>
                    <div>
                        <div><strong>${title}</strong></div>
                        <div>${message}</div>
                        ${countdown ? `<div class="notification-countdown" id="countdown">Redirecting in ${timeToRedirect} seconds...</div>` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(notification);
            disconnectNotification = notification;
            
            if (countdown) {
                startCountdown();
            }
        }
        
        function hideNotification() {
            if (disconnectNotification) {
                disconnectNotification.style.animation = 'slideOutRight 0.3s ease-in-out forwards';
                setTimeout(() => {
                    if (disconnectNotification && disconnectNotification.parentNode) {
                        disconnectNotification.parentNode.removeChild(disconnectNotification);
                    }
                    disconnectNotification = null;
                }, 300);
            }
            clearTimeout(reconnectTimer);
            clearInterval(countdownInterval);
        }

        function showGameResult(data) {
            const isWinner = data.winner === myPlayerIndex + 1;
            const overlay = document.createElement('div');
            overlay.className = 'game-result-overlay';
            
            overlay.innerHTML = `
                <div class="game-result-window">
                    <h1 class="result-title ${isWinner ? 'win' : 'lose'}">
                        ${isWinner ? 'You Win!' : 'You Lose'}
                    </h1>
                    <p class="result-subtitle">
                        ${isWinner ? 'Congratulations! You had the lowest average error.' : 'Better luck next time!'}
                    </p>
                    
                    <div class="score-container">
                        <div class="score-item">
                            <span class="score-label">True Correlation:</span>
                            <div class="score-value-container">
                                <span class="score-value">
                                    ${data.trueCorrelation.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Your Average Error:</span>
                            <div class="score-value-container">
                                <span class="score-value">
                                    ${(myPlayerIndex === 0 ? data.player1AvgError : data.player2AvgError).toFixed(2)}
                                </span>
                                ${data.winner === myPlayerIndex + 1 ? '<span class="winner-badge">Winner!</span>' : ''}
                            </div>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Opponent's Average Error:</span>
                            <div class="score-value-container">
                                <span class="score-value">
                                    ${(myPlayerIndex === 0 ? data.player2AvgError : data.player1AvgError).toFixed(2)}
                                </span>
                                ${data.winner !== myPlayerIndex + 1 ? '<span class="winner-badge">Winner!</span>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="result-actions">
                        <button class="result-btn secondary" onclick="playAgain()">
                            Play Again
                        </button>
                        <button class="result-btn primary" onclick="goToLobby()">
                            Exit to Lobby
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
        }

        function playAgain() {
            window.location.href = '/welcome.html';
        }

        function goToLobby() {
            window.location.href = '/welcome.html';
        }
        
        function startCountdown() {
            const countdownEl = document.getElementById('countdown');
            let timeLeft = timeToRedirect;
            
            countdownInterval = setInterval(() => {
                timeLeft--;
                if (countdownEl) {
                    countdownEl.textContent = `Redirecting in ${timeLeft} seconds...`;
                }
                
                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    window.location.href = '/welcome.html';
                }
            }, 1000);
        }


        function initChart() {
            const ctx = document.getElementById('scatterChart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Original Points',
                        data: initialData,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        borderColor: 'rgba(0, 0, 0, 1)',
                        borderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgba(0, 0, 0, 0.9)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointHoverBorderWidth: 3
                    }, {
                        label: 'My Points',
                        data: addedData,
                        backgroundColor: 'rgba(255, 0, 0, 0.8)',
                        borderColor: 'rgba(255, 0, 0, 1)',
                        borderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgba(255, 0, 0, 0.9)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointHoverBorderWidth: 3
                    }, {
                        label: 'Partner Points',
                        data: [],
                        backgroundColor: 'rgba(0, 255, 0, 0.8)',
                        borderColor: 'rgba(0, 255, 0, 1)',
                        borderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgba(0, 255, 0, 0.9)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointHoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 800,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(44, 62, 80, 0.95)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#667eea',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return `Point: (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            min: -100,
                            max: 100,
                            ticks: {
                                color: '#7f8c8d',
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: 'rgba(127, 140, 141, 0.2)',
                                lineWidth: 1
                            },
                            border: {
                                color: '#2c3e50',
                                width: 2
                            }
                        },
                        y: {
                            min: -100,
                            max: 100,
                            ticks: {
                                color: '#7f8c8d',
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: 'rgba(127, 140, 141, 0.2)',
                                lineWidth: 1
                            },
                            border: {
                                color: '#2c3e50',
                                width: 2
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (!hasSubmittedGuess) {
                            showNotification('warning', 'Guess Required', 'Please submit your correlation guess first!');
                            setTimeout(hideNotification, 3000);
                            return;
                        }

                        if (!canPerformAction()) {
                            if (gamePhase !== 'play') {
                                showNotification('warning', 'Game Phase', 'Game phase is not active!');
                            } else {
                                showNotification('warning', 'Turn Limit', currentTurn === myPlayerIndex ? 'You\'ve reached your turn limit! Wait for your opponent.' : 'It\'s not your turn!');
                            }
                            setTimeout(hideNotification, 3000);
                            return;
                        }

                        if (currentMode === 'remove' && elements.length > 0) {
                            const element = elements[0];
                            const datasetIndex = element.datasetIndex;
                            const pointIndex = element.index;
                            removePoint(datasetIndex, pointIndex);
                            if (socket && roomId) {
                                socket.emit('remove-point', { roomId, datasetIndex, pointIndex });
                                pointsInCurrentTurn++;
                                updateTurnDisplay();
                            }
                        } else if (currentMode === 'add') {
                            const rect = chart.canvas.getBoundingClientRect();
                            const canvasPosition = Chart.helpers.getRelativePosition(event, chart);
                            const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
                            const dataY = chart.scales.y.getValueForPixel(canvasPosition.y);

                            if (dataX >= -100 && dataX <= 100 && dataY >= -100 && dataY <= 100) {
                                addPoint(dataX, dataY);
                                if (socket && roomId) {
                                    socket.emit('add-point', { roomId, x: dataX, y: dataY });
                                    pointsInCurrentTurn++;
                                    updateTurnDisplay();
                                }
                            }
                        }
                    },
                    onHover: (event, elements) => {
                        chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'crosshair';
                    }
                }
            });
        }

        function addPoint(x, y) {
            addedData.push({x: x, y: y});
            chart.update('active');
            updateStats();
        }

        function addPartnerPoint(x, y) {
            chart.data.datasets[2].data.push({x: x, y: y});
            chart.update('active');
            updateStats();
        }

        function calculateCorrelation(data) {
            if (data.length < 2) {
                return 0;
            }

            const xValues = data.map(p => p.x);
            const yValues = data.map(p => p.y);
            const n = data.length;
            const sumX = xValues.reduce((a, b) => a + b, 0);
            const sumY = yValues.reduce((a, b) => a + b, 0);
            const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
            const sumX2 = xValues.reduce((acc, val) => acc + val * val, 0);
            const sumY2 = yValues.reduce((acc, val) => acc + val * val, 0);

            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

            if (denominator === 0) {
                return 0;
            }

            return numerator / denominator;
        }

        function updateStats() {
            return;
        }

        function updateTurnDisplay(serverTurnStartTime = null, serverTurnDuration = 20000) {
            const isMyTurn = currentTurn === myPlayerIndex;
            const pointsLeft = maxPointsPerTurn - pointsInCurrentTurn;
            const turnElement = document.getElementById('turnInfo');
            
            turnElement.textContent = isMyTurn ? 'Your turn' : 'Opponent\'s turn';
            document.getElementById('roundInfo').textContent = `${currentRound}/${maxRounds}`;
            document.getElementById('pointsLeft').textContent = isMyTurn ? pointsLeft : '-';

            // Add visual feedback for turn changes
            turnElement.className = isMyTurn ? 'my-turn' : 'partner-turn';

            const guessSection = document.getElementById('guessSection');
            if (gamePhase === 'guess' && isMyTurn && !hasSubmittedGuess) {
                guessSection.style.display = 'block';
                startTurnTimer(serverTurnStartTime, serverTurnDuration);
            } else {
                guessSection.style.display = 'none';
                if (isMyTurn && gamePhase === 'play') {
                    startTurnTimer(serverTurnStartTime, serverTurnDuration);
                } else {
                    stopTurnTimer();
                }
            }
        }

        function canPerformAction() {
            return hasSubmittedGuess && currentTurn === myPlayerIndex && pointsInCurrentTurn < maxPointsPerTurn;
        }

        function setMode(mode) {
            currentMode = mode;
            const addBtn = document.getElementById('addModeBtn');
            const removeBtn = document.getElementById('removeModeBtn');
            const instructionText = document.getElementById('instructionText');

            if (mode === 'add') {
                addBtn.classList.add('active');
                addBtn.classList.remove('secondary');
                removeBtn.classList.remove('active');
                removeBtn.classList.add('secondary');
            } else {
                removeBtn.classList.add('active');
                removeBtn.classList.remove('secondary');
                addBtn.classList.remove('active');
                addBtn.classList.add('secondary');
            }
        }

        function removePoint(datasetIndex, pointIndex) {
            if (datasetIndex === 0) {
                initialData.splice(pointIndex, 1);
            } else if (datasetIndex === 1) {
                addedData.splice(pointIndex, 1);
            } else if (datasetIndex === 2) {
                chart.data.datasets[2].data.splice(pointIndex, 1);
            }
            chart.update('active');
            updateStats();
        }

        function removePartnerPoint(datasetIndex, pointIndex) {
            if (datasetIndex === 0) {
                initialData.splice(pointIndex, 1);
            } else if (datasetIndex === 1) {
                chart.data.datasets[1].data.splice(pointIndex, 1);
            } else if (datasetIndex === 2) {
                chart.data.datasets[2].data.splice(pointIndex, 1);
            }
            chart.update('active');
            updateStats();
        }

        function initializeGame() {
            const urlParams = new URLSearchParams(window.location.search);
            roomId = urlParams.get('room');
            targetCorrelation = parseFloat(urlParams.get('correlation'));
            const initialDataParam = urlParams.get('initialData');
            myPlayerIndex = parseInt(urlParams.get('playerIndex') || '-1');
            currentTurn = parseInt(urlParams.get('currentTurn') || '0');
            pointsInCurrentTurn = parseInt(urlParams.get('pointsInCurrentTurn') || '0');
            maxPointsPerTurn = parseInt(urlParams.get('maxPointsPerTurn') || '3');
            currentRound = parseInt(urlParams.get('currentRound') || '1');
            gamePhase = urlParams.get('gamePhase') || 'guess';
            
            // Get timer data from URL parameters
            const turnStartTime = urlParams.get('turnStartTime') ? parseInt(urlParams.get('turnStartTime')) : null;
            const turnDuration = urlParams.get('turnDuration') ? parseInt(urlParams.get('turnDuration')) : 20000;

            if (!roomId || isNaN(targetCorrelation) || myPlayerIndex === -1) {
                window.location.href = '/welcome.html';
                return;
            }

            document.getElementById('roomId').textContent = roomId;
            document.getElementById('playerCount').textContent = '2';

            if (initialDataParam) {
                try {
                    initialData = JSON.parse(decodeURIComponent(initialDataParam));
                } catch (e) {
                    console.error('Error parsing initial data:', e);
                    initialData = generateCorrelatedData(initialPoints, targetCorrelation);
                }
            } else {
                initialData = generateCorrelatedData(initialPoints, targetCorrelation);
            }

            initChart();
            updateStats();
            updateTurnDisplay(turnStartTime, turnDuration);

            socket = io();
            socket.on('connect', () => {
                socket.emit('join-room', { roomId: roomId, playerIndex: myPlayerIndex });
            });

            // Socket event handlers
            socket.on('point-added', (point) => {
                if (point.userId !== socket.id) {
                    addPartnerPoint(point.x, point.y);
                }
                if (point.currentTurn !== undefined) {
                    currentTurn = point.currentTurn;
                    pointsInCurrentTurn = point.pointsInCurrentTurn;
                    updateTurnDisplay(point.turnStartTime, point.turnDuration);
                }
            });

            socket.on('point-removed', (data) => {
                if (data.userId !== socket.id) {
                    removePartnerPoint(data.datasetIndex, data.pointIndex);
                }
                if (data.currentTurn !== undefined) {
                    currentTurn = data.currentTurn;
                    pointsInCurrentTurn = data.pointsInCurrentTurn;
                    updateTurnDisplay(data.turnStartTime, data.turnDuration);
                }
            });

            // This is now the ONLY event that updates the turn on the client.
            socket.on('turn-changed', (turnData) => {
                console.log('Received authoritative turn-changed from server:', turnData);
                currentTurn = turnData.currentTurn;
                pointsInCurrentTurn = 0; // Reset local counter
                updateTurnDisplay(turnData.turnStartTime, turnData.turnDuration);
            });

            // This listener is no longer needed as the server never emits it.
            // socket.on('force-turn-switched', (turnData) => { ... });

            socket.on('guess-submitted', (data) => {
                // This event is now just for feedback, not for changing game state.
                if (data.playerIndex !== myPlayerIndex && !hasSubmittedGuess) {
                    // e.g., show a message "Partner has submitted their guess"
                }
            });

            socket.on('round-start', (data) => {
                gamePhase = 'play';
                updateTurnDisplay(data.turnStartTime, data.turnDuration);
            });

            socket.on('new-round', (data) => {
                currentRound = data.currentRound;
                gamePhase = data.gamePhase;
                currentTurn = data.currentTurn;
                hasSubmittedGuess = false;
                pointsInCurrentTurn = 0;
                document.getElementById('correlationGuess').disabled = false;
                document.getElementById('submitGuessBtn').disabled = false;
                document.getElementById('correlationGuess').value = '';
                stopTurnTimer();
                updateTurnDisplay(data.turnStartTime, data.turnDuration);
            });

            socket.on('game-over', (data) => {
                // Log true correlation, player guesses, and errors for each round
                console.log(`Game Over - True correlation: ${data.trueCorrelation.toFixed(3)}`);
                
                // Log player 1 data
                if (data.player1Guesses) {
                    data.player1Guesses.forEach((guess, index) => {
                        const error = Math.abs(data.trueCorrelation - guess.guess);
                        console.log(`Player 1 Round ${guess.round}: True corr used to compute error ${data.trueCorrelation.toFixed(3)}, player guess ${guess.guess}, error ${error.toFixed(3)}`);
                    });
                }
                
                // Log player 2 data
                if (data.player2Guesses) {
                    data.player2Guesses.forEach((guess, index) => {
                        const error = Math.abs(data.trueCorrelation - guess.guess);
                        console.log(`Player 2 Round ${guess.round}: True corr used to compute error ${data.trueCorrelation.toFixed(3)}, player guess ${guess.guess}, error ${error.toFixed(3)}`);
                    });
                }
                
                showGameResult(data);
            });

            socket.on('turn-error', (error) => {
                showNotification('warning', 'Turn Error', error.message);
                setTimeout(hideNotification, 3000);
            });

            socket.on('user-disconnected', () => {
                showNotification(
                    'warning',
                    'Opponent Disconnected',
                    'Opponent has left the game. You will be redirected to the lobby.',
                    true
                );
            });

            socket.on('partner-reconnecting', () => {
                showNotification(
                    'reconnecting',
                    'Opponent Reconnecting',
                    'Opponent is attempting to reconnect...'
                );
            });

            socket.on('partner-reconnected', () => {
                showNotification(
                    'reconnected',
                    'Partner Reconnected',
                    'Opponent has successfully reconnected!'
                );
                // Hide the notification after 3 seconds
                setTimeout(() => {
                    hideNotification();
                }, 3000);
            });

            // Handle game state sync for reconnecting users
            socket.on('game-state-sync', (stateData) => {
                console.log('Received game state sync:', stateData);
                currentTurn = stateData.currentTurn;
                pointsInCurrentTurn = stateData.pointsInCurrentTurn;
                maxPointsPerTurn = stateData.maxPointsPerTurn;
                currentRound = stateData.currentRound;
                maxRounds = stateData.maxRounds;
                gamePhase = stateData.gamePhase;
                
                // Restore points to the chart
                if (stateData.points && stateData.points.length > 0) {
                    stateData.points.forEach(point => {
                        if (point.userId === socket.id) {
                            chart.data.datasets[1].data.push({x: point.x, y: point.y});
                        } else {
                            chart.data.datasets[2].data.push({x: point.x, y: point.y});
                        }
                    });
                    chart.update();
                }
                
                // Check if user has submitted guess for current round
                if (stateData.guesses && stateData.guesses.length > 0) {
                    const myGuess = stateData.guesses.find(g => g.userId === socket.id && g.round === currentRound);
                    if (myGuess) {
                        hasSubmittedGuess = true;
                        document.getElementById('correlationGuess').value = myGuess.guess;
                    }
                }
                
                updateTurnDisplay(stateData.turnStartTime, stateData.turnDuration);
            });

            // Handle socket disconnect/reconnect events
            socket.on('disconnect', (reason) => {
                if (reason === 'io server disconnect') {
                    // Server disconnected this socket
                    showNotification(
                        'warning',
                        'Connection Lost',
                        'Lost connection to the game server. You will be redirected to the lobby.',
                        true
                    );
                } else {
                    // Client lost connection, will try to reconnect
                    showNotification(
                        'reconnecting',
                        'Reconnecting',
                        'Connection lost. Attempting to reconnect...'
                    );
                }
            });

            socket.on('connect', () => {
                // Only show reconnected message if we had a notification
                if (disconnectNotification && disconnectNotification.className.includes('reconnecting')) {
                    showNotification(
                        'reconnected',
                        'Reconnected',
                        'Successfully reconnected to the game!'
                    );
                    setTimeout(() => {
                        hideNotification();
                    }, 3000);
                }
            });
        }

        function startTurnTimer(serverTurnStartTime = null, serverTurnDuration = 20000) {
            stopTurnTimer(); // Clear any existing timer
            
            // Calculate remaining time based on server data
            if (serverTurnStartTime) {
                const elapsed = Date.now() - serverTurnStartTime;
                const remainingMs = Math.max(0, serverTurnDuration - elapsed);
                turnTimeLeft = Math.ceil(remainingMs / 1000);
            } else {
                turnTimeLeft = 20;
            }
            
            updateTimerDisplay();
            showTimerBar();
            
            turnTimer = setInterval(() => {
                turnTimeLeft--;
                updateTimerDisplay();
                
                if (turnTimeLeft <= 0) {
                    handleTurnTimeout();
                }
            }, 1000);
        }

        function stopTurnTimer() {
            if (turnTimer) {
                clearInterval(turnTimer);
                turnTimer = null;
            }
            const timerElement = document.getElementById('timerDisplay');
            timerElement.textContent = '-';
            timerElement.className = '';
            hideTimerBar();
        }

        function updateTimerDisplay() {
            const timerElement = document.getElementById('timerDisplay');
            timerElement.textContent = `${turnTimeLeft}s`;
            
            if (turnTimeLeft <= 5) {
                timerElement.className = 'warning';
            } else {
                timerElement.className = '';
            }
            
            updateTimerBar();
        }

        function showTimerBar() {
            const timerBarContainer = document.getElementById('timerBarContainer');
            timerBarContainer.style.display = 'block';
            updateTimerBar();
        }

        function hideTimerBar() {
            const timerBarContainer = document.getElementById('timerBarContainer');
            timerBarContainer.style.display = 'none';
        }

        function updateTimerBar() {
            const timerBar = document.getElementById('timerBar');
            const percentage = (turnTimeLeft / 20) * 100;
            
            timerBar.style.height = `${percentage}%`;
            
            if (turnTimeLeft <= 5) {
                timerBar.className = 'timer-bar warning';
            } else {
                timerBar.className = 'timer-bar';
            }
        }

        function handleTurnTimeout() {
            stopTurnTimer();
            console.log("Client-side timer expired. Waiting for server to update turn.");

            // The client no longer tells the server to switch turns.
            // It only handles client-side UX, like auto-submitting a guess.
            // The blocking `alert()` is removed.

            if (gamePhase === 'guess' && !hasSubmittedGuess) {
                // Auto-submit 0 as a guess if time runs out. This is good UX.
                const guessInput = document.getElementById('correlationGuess');
                guessInput.value = '0';
                submitGuess();
                // Use a non-blocking notification instead of an alert.
                showNotification('warning', 'Time Expired', 'Your guess was automatically submitted as 0.');
                setTimeout(hideNotification, 4000);
            }
        }

        function submitGuess() {
            const guessInput = document.getElementById('correlationGuess');
            let guess = parseFloat(guessInput.value);

            if (isNaN(guess) || guess < -1 || guess > 1) {
                // Use non-blocking notification for errors too.
                showNotification('warning', 'Invalid Input', 'Please enter a number between -1 and 1.');
                setTimeout(hideNotification, 4000);
                return;
            }

            // Log the player guess for each turn
            console.log(`Player ${myPlayerIndex + 1} Round ${currentRound}: player guess ${guess}`);

            guessInput.classList.add('submitting');
            setTimeout(() => guessInput.classList.remove('submitting'), 800);

            hasSubmittedGuess = true;
            // Stop the client-side timer immediately for better responsiveness.
            // The server will soon send a `turn-changed` event to confirm.
            stopTurnTimer();
            
            if (socket && roomId) {
                socket.emit('submit-guess', { roomId, guess, playerIndex: myPlayerIndex });
            }

            guessInput.disabled = true;
            document.getElementById('submitGuessBtn').disabled = true;
            // The updateTurnDisplay() call is removed from here. It will be triggered
            // by the 'turn-changed' event from the server.
        }

        window.addEventListener('load', () => {
            // Initialize background first
            const statsCanvas = document.getElementById('statsCanvas');
            if (statsCanvas) {
                const background = new StatisticalBackground(statsCanvas);
            }
            
            // Add typing animation and color changes to correlation guess input
            const correlationGuess = document.getElementById('correlationGuess');
            if (correlationGuess) {
                correlationGuess.addEventListener('input', function() {
                    // Restrict to 2 decimal places
                    let value = this.value;
                    if (value.includes('.')) {
                        const parts = value.split('.');
                        if (parts[1] && parts[1].length > 2) {
                            this.value = parts[0] + '.' + parts[1].substring(0, 2);
                        }
                    }
                    
                    // Add typing animation
                    this.classList.add('typing');
                    setTimeout(() => {
                        this.classList.remove('typing');
                    }, 300);
                    
                    // Update color based on value
                    updateGuessColor(this);
                });
                
                // Also update color on blur
                correlationGuess.addEventListener('blur', function() {
                    updateGuessColor(this);
                });
            }
            
            function updateGuessColor(input) {
                const value = parseFloat(input.value);
                
                // Remove existing color classes
                input.classList.remove('positive', 'negative', 'invalid');
                
                if (input.value === '' || input.value === '-' || input.value === '.') {
                    // Empty or partial input - no color
                    return;
                }
                
                if (!isNaN(value)) {
                    if (value > 0) {
                        input.classList.add('positive');
                    } else {
                        input.classList.add('negative');
                    }
                }
            }
            
            // Then initialize game
            initializeGame();
        });
    </script>
</body>
</html>
```

# package.json

```json
{
  "name": "r-arena",
  "version": "1.0.0",
  "description": "Real-time collaborative scatterplot game",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "nanoid": "^5.1.5",
    "socket.io": "^4.7.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}

```

# server.js

```js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// Route to welcome page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcome.html'));
});

// Room management
const waitingQueue = [];
const rooms = new Map();

// Generate room ID
function generateRoomId() {
    return nanoid(9); // Generates a 9-character unique ID
}

// Generate random correlation for room
function generateRandomCorrelation() {
    return Math.random() * 1.4 - 0.7; // Random correlation between -0.7 and 0.7
}

// Generate correlated data points (same function as client-side)
function generateCorrelatedData(n, r) {
    const randn_bm = () => {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }

    const x_norm = Array.from({length: n}, () => randn_bm());
    const e_norm = Array.from({length: n}, () => randn_bm());

    const y_norm = x_norm.map((val, i) => r * val + Math.sqrt(1 - r*r) * e_norm[i]);

    const scale = (arr) => {
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        const range = max - min;
        if (range === 0) return arr.map(() => 0);
        return arr.map(val => ((val - min) / range) * 190 - 95);
    };

    const scaledX = scale(x_norm);
    const scaledY = scale(y_norm);

    return scaledX.map((val, i) => ({x: val, y: scaledY[i]}));
}

// Calculate correlation from data points
function calculateCorrelation(data) {
    if (data.length < 2) {
        return 0;
    }

    const xValues = data.map(p => p.x);
    const yValues = data.map(p => p.y);

    const n = data.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumX2 = xValues.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = yValues.reduce((acc, val) => acc + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) {
        return 0;
    }

    return numerator / denominator;
}

// Get the current complete point state (initial + added - removed)
function getCurrentPointState(room) {
    // This is a simplified approach: we start with initial data and apply all changes
    // A more robust approach would track the full point history, but for now we'll
    // reconstruct the current state based on the fact that:
    // - room.points contains all added points this round
    // - room.removedPoints contains metadata about removals, but we can't easily 
    //   reconstruct which specific points were removed without more complex tracking
    
    // For now, return initial data + added points
    // Note: This doesn't perfectly handle removals, but it's better than just initial data
    let currentPoints = [...room.initialData];
    
    // Add all points that were added during gameplay
    const addedPoints = room.points || [];
    currentPoints = currentPoints.concat(addedPoints);
    
    // TODO: Implement proper removal tracking
    // For now, we approximate by noting that removals happened but don't track exactly which points
    
    return currentPoints;
}

/**
 * The single, authoritative function for switching turns.
 * It clears any existing server-side timer and sets a new one for the next turn.
 * @param {string} roomId - The ID of the room.
 * @param {boolean} isTimeout - Flag to indicate if the switch was forced by a timeout.
 */
function switchTurn(roomId, isTimeout = false) {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // 1. Clear any existing timer for the turn that is now ending.
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }

    if (isTimeout) {
        console.log(`[${roomId}] Turn for player ${room.currentTurn} ended due to server timeout.`);
    }

    // 2. Advance the game state
    room.currentTurn = 1 - room.currentTurn;
    room.pointsInCurrentTurn = 0;
    room.turnCount++;
    room.turnStartTime = Date.now();
    console.log(`[${roomId}] Turn switched to player ${room.currentTurn}. Total turns: ${room.turnCount}`);
    
    // 3. Emit the change to all clients
    io.to(roomId).emit('turn-changed', {
        currentTurn: room.currentTurn,
        pointsInCurrentTurn: room.pointsInCurrentTurn,
        turnStartTime: room.turnStartTime,
        turnDuration: room.turnDuration
    });

    // 4. Handle round/game logic
    // Check if both players have completed their turns (guess + moves) for this round
    const roundGuesses = room.guesses.filter(g => g.round === room.currentRound);
    if (room.turnCount >= 2 && roundGuesses.length === 2) {
        handleRoundCompletion(roomId);
    } else {
        // 5. Set a new server-side timer for the new turn
        room.turnTimer = setTimeout(() => {
            switchTurn(roomId, true); // Force the next switch on timeout
        }, room.turnDuration + 500); // Add a 500ms grace period
    }
}

function handleRoundCompletion(roomId) {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // Clear any leftover timer when the round ends
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }

    room.roundsCompleted++;
    if (room.roundsCompleted >= room.maxRounds) {
        calculateFinalScores(roomId);
    } else {
        // Start new round
        room.currentRound++;
        room.gamePhase = 'guess';
        room.currentTurn = 0;
        room.pointsInCurrentTurn = 0;
        room.turnCount = 0;
        room.points = [];
        room.removedPoints = []; // Reset removed points for new round
        room.turnStartTime = Date.now();
        
        console.log(`[${roomId}] Starting new round ${room.currentRound}`);

        // Set a timer for the first player's guess in the new round
        room.turnTimer = setTimeout(() => {
            switchTurn(roomId, true);
        }, room.turnDuration + 500);

        io.to(roomId).emit('new-round', {
            currentRound: room.currentRound,
            gamePhase: room.gamePhase,
            currentTurn: room.currentTurn,
            turnStartTime: room.turnStartTime,
            turnDuration: room.turnDuration
        });
    }
}

function calculateFinalScores(roomId) {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // Clean up the timer when the game is over
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }
    
    const player1Guesses = room.guesses.filter(g => g.playerIndex === 0);
    const player2Guesses = room.guesses.filter(g => g.playerIndex === 1);
    
    // Calculate errors for each guess based on the actual point state when the guess was made
    const player1Errors = player1Guesses.map(g => {
        const pointStateAtGuess = g.pointState || room.initialData; // fallback to initial data if not tracked
        const correlationAtGuess = calculateCorrelation(pointStateAtGuess);
        const error = Math.abs(correlationAtGuess - g.guess);
        console.log(`[${roomId}] Player 1 Round ${g.round}: True corr used to compute error=${correlationAtGuess.toFixed(3)}, Player guess=${g.guess}, Error=${error.toFixed(3)}`);
        return error;
    });
    
    const player2Errors = player2Guesses.map(g => {
        const pointStateAtGuess = g.pointState || room.initialData; // fallback to initial data if not tracked
        const correlationAtGuess = calculateCorrelation(pointStateAtGuess);
        const error = Math.abs(correlationAtGuess - g.guess);
        console.log(`[${roomId}] Player 2 Round ${g.round}: True corr used to compute error=${correlationAtGuess.toFixed(3)}, Player guess=${g.guess}, Error=${error.toFixed(3)}`);
        return error;
    });
    
    const player1AvgError = player1Errors.length > 0 ? player1Errors.reduce((a, b) => a + b, 0) / player1Errors.length : Infinity;
    const player2AvgError = player2Errors.length > 0 ? player2Errors.reduce((a, b) => a + b, 0) / player2Errors.length : Infinity;
    const winner = player1AvgError < player2AvgError ? 1 : (player2AvgError < player1AvgError ? 2 : 0); // Handle ties

    console.log(`[${roomId}] Game over - Player 1 Avg Error: ${player1AvgError.toFixed(3)}, Player 2 Avg Error: ${player2AvgError.toFixed(3)}, Winner: ${winner}`);
    
    // Calculate final correlation based on the current point state
    const finalPointState = getCurrentPointState(room);
    const finalCorrelation = calculateCorrelation(finalPointState);
    console.log(`[${roomId}] Final point state has ${finalPointState.length} points with correlation ${finalCorrelation.toFixed(3)}`);
    
    io.to(roomId).emit('game-over', {
        trueCorrelation: finalCorrelation,
        player1AvgError,
        player2AvgError,
        winner,
        player1Guesses,
        player2Guesses
    });
    rooms.delete(roomId);
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-queue', () => {
        console.log('User joined queue:', socket.id);
        if (waitingQueue.length > 0) {
            // Match with waiting user
            const waitingUser = waitingQueue.pop();
            const roomId = generateRoomId();
            const correlation = generateRandomCorrelation();
            const initialData = generateCorrelatedData(10, correlation);
            
            // Create room
            const room = {
                users: [waitingUser.id, socket.id],
                correlation: correlation,
                initialData: initialData,
                points: [],
                removedPoints: [], // Track point removals
                currentTurn: 0, // 0 = first user, 1 = second user
                pointsInCurrentTurn: 0,
                maxPointsPerTurn: 3,
                currentRound: 1,
                maxRounds: 3,
                gamePhase: 'guess', // 'guess' or 'play'
                guesses: [], // Array to store all guesses with rounds
                roundsCompleted: 0,
                turnCount: 0, // Track total turns completed
                turnStartTime: Date.now(), // Track when current turn started
                turnDuration: 20000, // 20 seconds per turn in milliseconds
                turnTimer: null // Initialize timer property
            };
            rooms.set(roomId, room);
            
            // Join both users to room
            waitingUser.join(roomId);
            socket.join(roomId);
            
            // Start the first timer for the guess phase
            room.turnTimer = setTimeout(() => {
                switchTurn(roomId, true);
            }, room.turnDuration + 500);
            
            // Send room info to both users
            const roomData = {
                roomId: roomId,
                correlation: correlation,
                initialData: initialData,
                users: 2,
                currentTurn: 0,
                pointsInCurrentTurn: 0,
                maxPointsPerTurn: 3,
                currentRound: 1,
                maxRounds: 3,
                gamePhase: 'guess',
                playerIndex: { [waitingUser.id]: 0, [socket.id]: 1 },
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
            };
            
            waitingUser.emit('room-matched', roomData);
            socket.emit('room-matched', roomData);
            
            console.log(`Room ${roomId} created with users ${waitingUser.id} and ${socket.id}`);
        } else {
            // Add to waiting queue
            waitingQueue.push(socket);
            socket.emit('waiting-for-match');
            console.log(`User ${socket.id} added to waiting queue`);
        }
    });

    socket.on('create-room', () => {
        console.log('User creating room:', socket.id);
        const roomId = generateRoomId();
        const correlation = generateRandomCorrelation();
        const initialData = generateCorrelatedData(10, correlation);
        
        // Create room with only one user initially
        rooms.set(roomId, {
            users: [socket.id, null], // Second slot empty for friend to join
            correlation: correlation,
            initialData: initialData,
            points: [],
            removedPoints: [], // Track point removals
            currentTurn: 0,
            pointsInCurrentTurn: 0,
            maxPointsPerTurn: 3,
            currentRound: 1,
            maxRounds: 3,
            gamePhase: 'guess',
            guesses: [],
            roundsCompleted: 0,
            turnCount: 0,
            createdBy: socket.id,
            turnStartTime: null,
            turnDuration: 20000,
            turnTimer: null // Initialize timer property
        });
        
        socket.join(roomId);
        
        // Send room info to creator
        socket.emit('room-created', {
            roomId: roomId,
            correlation: correlation,
            initialData: initialData
        });
        
        console.log(`Room ${roomId} created by user ${socket.id}`);
    });

    socket.on('join-room-by-id', (data) => {
        const roomId = data.roomId.toLowerCase(); // Convert to lowercase for case-insensitive lookup
        console.log(`User ${socket.id} attempting to join room by ID: ${roomId}`);
        
        if (!rooms.has(roomId)) {
            socket.emit('room-join-error', { message: 'Room not found' });
            return;
        }
        
        const room = rooms.get(roomId);
        
        // Check if room is full
        if (room.users[0] && room.users[1]) {
            socket.emit('room-join-error', { message: 'Room is full' });
            return;
        }
        
        // Add user to room
        const playerIndex = room.users[0] === null ? 0 : 1;
        room.users[playerIndex] = socket.id;
        
        socket.join(roomId);
        
        // If room is now full, start the game
        if (room.users[0] && room.users[1]) {
            // Set initial turn start time
            room.turnStartTime = Date.now();
            
            // Start the first timer for the guess phase
            room.turnTimer = setTimeout(() => {
                switchTurn(roomId, true);
            }, room.turnDuration + 500);
            
            const roomData = {
                roomId: roomId,
                correlation: room.correlation,
                initialData: room.initialData,
                users: 2,
                currentTurn: 0,
                pointsInCurrentTurn: 0,
                maxPointsPerTurn: 3,
                currentRound: 1,
                maxRounds: 3,
                gamePhase: 'guess',
                playerIndex: { [room.users[0]]: 0, [room.users[1]]: 1 },
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
            };
            
            // Send to both users
            io.to(roomId).emit('room-matched', roomData);
            console.log(`Room ${roomId} is now full and starting game`);
        } else {
            // Send waiting message to the joiner
            socket.emit('room-waiting', {
                roomId: roomId,
                message: 'Waiting for the room creator to start the game...'
            });
            console.log(`User ${socket.id} joined room ${roomId}, waiting for second player`);
        }
    });

    socket.on('join-room', (data) => {
        const roomId = data.roomId || data; // Handle both string and object
        const playerIndex = data.playerIndex;
        
        console.log(`User ${socket.id} attempting to join room ${roomId} as player ${playerIndex}`);
        if (rooms.has(roomId)) {
            socket.join(roomId);
            
            // Update room users list with correct socket ID at correct position
            const room = rooms.get(roomId);
            
            // Check if this is a reconnection
            if (room.disconnectedUser && room.disconnectedUser.index === playerIndex) {
                console.log(`User ${socket.id} reconnecting to room ${roomId} at index ${playerIndex}`);
                
                // Clear disconnected user data
                delete room.disconnectedUser;
                
                // Notify the other player about successful reconnection
                socket.to(roomId).emit('partner-reconnected');
                
                console.log(`User ${socket.id} successfully reconnected to room ${roomId}`);
            }
            
            if (playerIndex !== undefined && (playerIndex === 0 || playerIndex === 1)) {
                room.users[playerIndex] = socket.id;
                console.log(`Updated room ${roomId} users at index ${playerIndex}: ${socket.id}`);
            }
            
            console.log(`User ${socket.id} successfully joined room ${roomId}`);
            console.log(`Room ${roomId} users:`, room.users);
            
            // Send current game state to reconnecting user
            socket.emit('game-state-sync', {
                roomId: roomId,
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn,
                maxPointsPerTurn: room.maxPointsPerTurn,
                currentRound: room.currentRound,
                maxRounds: room.maxRounds,
                gamePhase: room.gamePhase,
                points: room.points,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration,
                turnCount: room.turnCount,
                guesses: room.guesses
            });
        } else {
            console.log(`Room ${roomId} does not exist for user ${socket.id}`);
        }
    });

    socket.on('add-point', (data) => {
        console.log(`Received add-point from ${socket.id}:`, data);
        const roomId = data.roomId;
        const x = parseFloat(data.x);
        const y = parseFloat(data.y);
        
        // Server-side input validation
        if (isNaN(x) || isNaN(y) || x < -100 || x > 100 || y < -100 || y > 100) {
            console.log(`[${roomId}] Invalid point coordinates received from ${socket.id}: x=${data.x}, y=${data.y}`);
            socket.emit('turn-error', { message: 'Invalid point coordinates. Must be between -100 and 100.' });
            return;
        }
        
        const point = { x: x, y: y, userId: socket.id };
        
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const userIndex = room.users.indexOf(socket.id);
            
            // Check if it's this player's turn
            if (userIndex !== room.currentTurn) {
                console.log(`User ${socket.id} tried to add point but it's not their turn. Current turn: ${room.currentTurn}, User index: ${userIndex}`);
                socket.emit('turn-error', { message: "It's not your turn!" });
                return;
            }
            
            // Check if player has submitted a guess for this round
            const playerGuessForRound = room.guesses.find(g => g.playerIndex === userIndex && g.round === room.currentRound);
            if (!playerGuessForRound) {
                console.log(`User ${socket.id} tried to add point but hasn't submitted guess for round ${room.currentRound}`);
                socket.emit('turn-error', { message: "Please submit your correlation guess first!" });
                return;
            }
            
            // Check if player has reached max points for this turn
            if (room.pointsInCurrentTurn >= room.maxPointsPerTurn) {
                console.log(`User ${socket.id} tried to add point but turn limit reached`);
                socket.emit('turn-error', { message: "You've reached your point move limit!" });
                return;
            }
            
            // Add the point
            room.points.push(point);
            room.pointsInCurrentTurn++;
            
            console.log(`Point added by player ${userIndex}. Points in turn: ${room.pointsInCurrentTurn}/${room.maxPointsPerTurn}`);
            
            // Broadcast the point addition
            io.to(roomId).emit('point-added', {
                ...point,
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
            });
            
            // Switch turn if max points reached
            if (room.pointsInCurrentTurn >= room.maxPointsPerTurn) {
                console.log(`Player ${userIndex} completed point moves, switching turn`);
                switchTurn(roomId);
            }
        } else {
            console.log(`Room ${roomId} does not exist when adding point`);
        }
    });

    socket.on('remove-point', (data) => {
        console.log(`Received remove-point from ${socket.id}:`, data);
        const roomId = data.roomId;
        const removeData = { datasetIndex: data.datasetIndex, pointIndex: data.pointIndex, userId: socket.id };
        
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const userIndex = room.users.indexOf(socket.id);
            
            // Check if it's this player's turn
            if (userIndex !== room.currentTurn) {
                socket.emit('turn-error', { message: "It's not your turn!" });
                return;
            }
            
            // Check if player has submitted a guess for this round
            const playerGuessForRound = room.guesses.find(g => g.playerIndex === userIndex && g.round === room.currentRound);
            if (!playerGuessForRound) {
                socket.emit('turn-error', { message: "Please submit your correlation guess first!" });
                return;
            }
            
            // Check if player has reached max points for this turn
            if (room.pointsInCurrentTurn >= room.maxPointsPerTurn) {
                socket.emit('turn-error', { message: "You've reached your point move limit!" });
                return;
            }
            
            // Track the point removal for correlation calculation
            room.removedPoints.push({
                datasetIndex: data.datasetIndex,
                pointIndex: data.pointIndex,
                userId: socket.id,
                round: room.currentRound
            });
            
            room.pointsInCurrentTurn++;
            
            console.log(`Point removed by player ${userIndex}. Points in turn: ${room.pointsInCurrentTurn}/${room.maxPointsPerTurn}`);
            
            // Broadcast point removal to all users in room
            io.to(roomId).emit('point-removed', {
                ...removeData,
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
            });
            
            // Switch turn if max points reached
            if (room.pointsInCurrentTurn >= room.maxPointsPerTurn) {
                console.log(`Player ${userIndex} completed point moves, switching turn`);
                switchTurn(roomId);
            }
        } else {
            console.log(`Room ${roomId} does not exist when removing point`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove from waiting queue if present
        const queueIndex = waitingQueue.findIndex(s => s.id === socket.id);
        if (queueIndex !== -1) {
            waitingQueue.splice(queueIndex, 1);
            console.log(`Removed user ${socket.id} from waiting queue`);
        }
        
        // Find room where this user was playing
        let userRoom = null;
        let userIndex = -1;
        
        for (const [roomId, room] of rooms.entries()) {
            const index = room.users.indexOf(socket.id);
            if (index !== -1) {
                userRoom = roomId;
                userIndex = index;
                break;
            }
        }
        
        if (userRoom) {
            const room = rooms.get(userRoom);
            console.log(`User ${socket.id} disconnected from room ${userRoom}`);
            
            // Mark user as disconnected but don't remove immediately
            room.users[userIndex] = null;
            room.disconnectedUser = {
                id: socket.id,
                index: userIndex,
                disconnectTime: Date.now()
            };
            
            // Notify the remaining player
            socket.to(userRoom).emit('partner-reconnecting');
            
            // Set a timer to clean up the room if user doesn't reconnect
            setTimeout(() => {
                if (rooms.has(userRoom)) {
                    const currentRoom = rooms.get(userRoom);
                    if (currentRoom.disconnectedUser && currentRoom.disconnectedUser.id === socket.id) {
                        // User didn't reconnect, notify partner and clean up
                        console.log(`User ${socket.id} didn't reconnect to room ${userRoom}, cleaning up`);
                        socket.to(userRoom).emit('user-disconnected');
                        rooms.delete(userRoom);
                    }
                }
            }, 30000); // 30 second grace period for reconnection
        }
    });
    
    socket.on('submit-guess', (data) => {
        console.log(`Received guess from ${socket.id}:`, data);
        const roomId = data.roomId;
        const guess = parseFloat(data.guess);
        const playerIndex = data.playerIndex;
        
        // Server-side input validation
        if (isNaN(guess) || guess < -1 || guess > 1) {
            console.log(`[${roomId}] Invalid guess received from ${socket.id}: ${data.guess}`);
            socket.emit('turn-error', { message: 'Invalid guess value. Must be between -1 and 1.' });
            return;
        }
        
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            
            // Verify it's the player's turn
            if (room.currentTurn !== playerIndex) {
                socket.emit('turn-error', { message: "It's not your turn!" });
                return;
            }
            
            // Check if player has already guessed this round
            const existingGuess = room.guesses.find(g => g.playerIndex === playerIndex && g.round === room.currentRound);
            if (existingGuess) {
                socket.emit('turn-error', { message: "You've already submitted a guess for this round!" });
                return;
            }
            
            // Store the guess with current point state
            const currentPointState = getCurrentPointState(room);
            const correlationAtGuess = calculateCorrelation(currentPointState);
            console.log(`[${roomId}] Player ${playerIndex} submitted guess ${guess} in round ${room.currentRound}. Point state: ${currentPointState.length} points, correlation: ${correlationAtGuess.toFixed(3)}`);
            
            room.guesses.push({
                playerIndex: playerIndex,
                guess: guess,
                round: room.currentRound,
                userId: socket.id,
                pointState: currentPointState // Capture point state at time of guess
            });
            
            console.log(`Guess stored for player ${playerIndex} in round ${room.currentRound}: ${guess}`);
            
            // Reset pointsInCurrentTurn to allow point moves in the same turn
            room.pointsInCurrentTurn = 0;
            
            // Notify clients that the guess was accepted and point moves can begin
            io.to(roomId).emit('guess-submitted', {
                playerIndex: playerIndex,
                round: room.currentRound,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
            });
            
            // Update clients with current turn state (no phase change yet)
            io.to(roomId).emit('turn-changed', {
                currentTurn: room.currentTurn,
                pointsInCurrentTurn: room.pointsInCurrentTurn,
                turnStartTime: room.turnStartTime,
                turnDuration: room.turnDuration
            });
            
            // Restart the turn timer to give time for point moves
            if (room.turnTimer) clearTimeout(room.turnTimer);
            room.turnStartTime = Date.now();
            room.turnTimer = setTimeout(() => switchTurn(roomId, true), room.turnDuration + 500);
        } else {
            console.log(`Room ${roomId} does not exist when submitting guess`);
        }
    });
    
    // This listener is now effectively deprecated but harmless to keep for backward compatibility.
    socket.on('force-turn-switch', (data) => {
        console.log(`[${data.roomId}] Received legacy 'force-turn-switch' from ${socket.id}. Server is authoritative.`);
    });
    
    socket.on('end-game', (data) => {
        const roomId = data.roomId;
        if (rooms.has(roomId)) {
            calculateFinalScores(roomId);
        }
    });
    
    // Add explicit leave-room handler for when users actually want to leave
    socket.on('leave-room', (roomId) => {
        console.log(`User ${socket.id} leaving room ${roomId}`);
        if (rooms.has(roomId)) {
            socket.to(roomId).emit('user-disconnected');
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

# welcome.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R Arena - Welcome</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            min-height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            position: relative;
        }

        /* Interactive Statistical Background */
        .stats-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.4;
        }

        .stats-canvas {
            width: 100%;
            height: 100%;
        }

        .hero {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            position: relative;
            z-index: 1;
        }

        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 32px;
            box-shadow: 
                0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04),
                0 0 0 1px rgba(255, 255, 255, 0.5);
            padding: 60px 48px;
            max-width: 560px;
            width: 100%;
            text-align: center;
            border: 1px solid rgba(0,0,0,0.05);
            position: relative;
            overflow: hidden;
            animation: slideUp 0.8s ease-out;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #000 0%, #4a5568 50%, #000 100%);
            animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        .header h1 {
            color: #0f172a;
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 16px;
            letter-spacing: -0.025em;
            background: linear-gradient(135deg, #000 0%, #4a5568 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: fadeInDown 1s ease-out 0.2s both;
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .subtitle {
            color: #64748b;
            font-size: 1.25rem;
            font-weight: 500;
            margin-bottom: 8px;
            letter-spacing: -0.01em;
            animation: fadeInDown 1s ease-out 0.4s both;
        }

        .description {
            color: #64748b;
            font-size: 1.1rem;
            font-weight: 400;
            margin-bottom: 48px;
            line-height: 1.6;
            max-width: 420px;
            margin-left: auto;
            margin-right: auto;
            animation: fadeInDown 1s ease-out 0.6s both;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 24px;
            margin-bottom: 48px;
            padding: 0 20px;
        }

        .feature {
            text-align: center;
            animation: fadeInUp 0.8s ease-out both;
            transition: transform 0.3s ease;
        }

        .feature:nth-child(1) { animation-delay: 0.8s; }
        .feature:nth-child(2) { animation-delay: 1s; }
        .feature:nth-child(3) { animation-delay: 1.2s; }

        .feature:hover {
            transform: translateY(-5px);
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .feature-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
            font-size: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .feature:hover .feature-icon {
            background: linear-gradient(135deg, #000, #4a5568);
            color: white;
            transform: scale(1.1);
        }

        .feature h3 {
            color: #1e293b;
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .feature p {
            color: #64748b;
            font-size: 0.85rem;
            line-height: 1.4;
        }

        .cta-section {
            margin-bottom: 24px;
            animation: fadeInUp 1s ease-out 1.4s both;
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: center;
        }

        .btn {
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            color: white;
            border: none;
            padding: 20px 48px;
            border-radius: 24px;
            cursor: pointer;
            font-size: 18px;
            font-weight: 700;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            letter-spacing: -0.02em;
            min-width: 240px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1);
            border: 2px solid transparent;
            background-clip: padding-box;
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s;
        }

        .btn:hover::before {
            left: 100%;
        }

        .btn:hover {
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 16px 40px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15);
            border-color: rgba(255,255,255,0.1);
        }

        .btn:active {
            transform: translateY(-2px) scale(1.01);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .btn.secondary {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            color: #1a1a1a;
            border: 2px solid #e2e8f0;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .btn.secondary:hover {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-color: #cbd5e1;
            box-shadow: 0 12px 30px rgba(0,0,0,0.15), 0 6px 15px rgba(0,0,0,0.1);
        }

        .button-group {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .divider {
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            margin: 8px 0;
        }

        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
        }

        .divider span {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .room-code-section {
            margin: 24px 0;
            padding: 32px 24px;
            background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
            border-radius: 20px;
            border: 1px solid #e9ecef;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
            animation: slideDown 0.5s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .room-code-section input {
            width: 220px;
            padding: 16px 20px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 16px;
            text-align: center;
            margin-right: 12px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            text-transform: lowercase;
            background: white;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .room-code-section input:focus {
            outline: none;
            border-color: #000;
            box-shadow: 0 0 0 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }

        .room-code-section input::placeholder {
            color: #9ca3af;
            font-weight: 400;
        }

        .btn-cancel {
            background: transparent;
            color: #6b7280;
            border: 2px solid #d1d5db;
            padding: 14px 24px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 8px;
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .btn-cancel:hover {
            background: #f3f4f6;
            color: #374151;
            border-color: #9ca3af;
            transform: translateY(-2px);
        }

        .room-created-section {
            margin: 24px 0;
            padding: 32px 24px;
            background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
            border-radius: 20px;
            border: 1px solid #bbf7d0;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
            animation: bounceIn 0.6s ease-out;
        }

        @keyframes bounceIn {
            0% {
                opacity: 0;
                transform: scale(0.3);
            }
            50% {
                opacity: 1;
                transform: scale(1.05);
            }
            70% {
                transform: scale(0.9);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        .room-code-display p {
            margin: 0 0 16px 0;
            color: #065f46;
            font-weight: 600;
            font-size: 1.1rem;
        }

        .room-code {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin: 16px 0;
        }

        .room-code span {
            background: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 1.5rem;
            font-weight: bold;
            letter-spacing: 3px;
            color: #000;
            border: 2px solid #10b981;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% {
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            }
            50% {
                box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
            }
        }

        .copy-btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .copy-btn:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .room-instruction {
            margin: 16px 0 0 0;
            color: #065f46;
            font-size: 0.9rem;
        }

        .status {
            margin-top: 32px;
            padding: 24px;
            border-radius: 16px;
            font-size: 1rem;
            font-weight: 500;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .status.waiting {
            background: rgba(248, 250, 252, 0.9);
            color: #475569;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .status.matched {
            background: rgba(240, 249, 255, 0.95);
            color: #0c4a6e;
            border: 1px solid #7dd3fc;
            box-shadow: 0 4px 20px rgba(125, 211, 252, 0.3);
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #000;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .footer {
            text-align: center;
            padding: 32px 20px;
            color: #94a3b8;
            font-size: 0.9rem;
            position: relative;
            z-index: 1;
            animation: fadeIn 1s ease-out 1.6s both;
        }

        .hidden {
            display: none;
        }

        @media (max-width: 640px) {
            .container {
                padding: 48px 32px;
                margin: 0 16px;
                border-radius: 24px;
            }

            .header h1 {
                font-size: 2.75rem;
            }

            .subtitle {
                font-size: 1.1rem;
            }

            .description {
                font-size: 1rem;
                margin-bottom: 40px;
            }

            .features {
                grid-template-columns: 1fr;
                gap: 20px;
                margin-bottom: 40px;
            }

            .btn {
                width: 100%;
                max-width: 280px;
            }

            .room-code-section input {
                width: 180px;
                margin-bottom: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="stats-background">
        <canvas class="stats-canvas" id="statsCanvas"></canvas>
    </div>

    <div class="hero">
        <div class="container">
            <div class="header">
                <h1>R Arena</h1>
                <p class="subtitle">Real-time Collaborative Game</p>
                <p class="description">Match with another player and work together to create interesting patterns on a shared scatterplot. Explore correlations and have fun with data visualization!</p>
            </div>

            <div class="cta-section">
                <button id="joinBtn" class="btn">Quick Match</button>
                <div class="divider">
                    <span>or</span>
                </div>
                <div class="button-group">
                    <button id="createRoomBtn" class="btn secondary">Create Room</button>
                    <button id="joinRoomBtn" class="btn secondary">Join Room</button>
                </div>
            </div>

            <div id="roomCodeSection" class="room-code-section hidden">
                <input type="text" id="roomCodeInput" placeholder="Enter room code" maxlength="9">
                <button id="joinByCodeBtn" class="btn">Join</button>
                <button id="cancelJoinBtn" class="btn-cancel">Cancel</button>
            </div>

            <div id="roomCreatedSection" class="room-created-section hidden">
                <div class="room-code-display">
                    <p>Room Created!</p>
                    <div class="room-code">
                        <span id="roomCodeDisplay"></span>
                        <button id="copyCodeBtn" class="copy-btn" title="Copy room code">📋</button>
                    </div>
                    <p class="room-instruction">Share this code with your friend</p>
                </div>
            </div>

            <div id="status" class="status hidden">
                <div class="loading"></div>
                <span id="statusText">Waiting for another player...</span>
            </div>
        </div>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        // Interactive Statistical Background
        class StatisticalBackground {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.points = [];
                this.correlationLines = [];
                this.mouseX = 0;
                this.mouseY = 0;
                this.time = 0;
                
                this.resize();
                this.generatePoints();
                this.setupEventListeners();
                this.animate();
            }

            resize() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                this.width = this.canvas.width;
                this.height = this.canvas.height;
            }

            generatePoints() {
                this.points = [];
                const numPoints = Math.min(50, Math.floor(this.width * this.height / 15000));
                
                // Generate correlated data points
                for (let i = 0; i < numPoints; i++) {
                    const correlation = Math.sin(i * 0.1) * 0.8; // Varying correlation
                    const x = Math.random() * this.width;
                    const baseY = this.height * 0.5 + (x - this.width * 0.5) * correlation * 0.3;
                    const y = baseY + (Math.random() - 0.5) * 100;
                    
                    this.points.push({
                        x: x,
                        y: Math.max(50, Math.min(this.height - 50, y)),
                        originalX: x,
                        originalY: y,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        size: Math.random() * 3 + 1,
                        opacity: Math.random() * 0.6 + 0.2,
                        correlation: correlation,
                        phase: Math.random() * Math.PI * 2
                    });
                }
            }

            setupEventListeners() {
                window.addEventListener('resize', () => this.resize());
                
                document.addEventListener('mousemove', (e) => {
                    this.mouseX = e.clientX;
                    this.mouseY = e.clientY;
                });

                // Make background interactive
                this.canvas.style.pointerEvents = 'auto';
                this.canvas.addEventListener('click', (e) => {
                    this.createRipple(e.clientX, e.clientY);
                });
            }

            createRipple(x, y) {
                // Create ripple effect that affects nearby points
                this.points.forEach(point => {
                    const dx = point.x - x;
                    const dy = point.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        const force = (150 - distance) / 150;
                        point.vx += (dx / distance) * force * 2;
                        point.vy += (dy / distance) * force * 2;
                    }
                });
            }

            drawGrid() {
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
                this.ctx.lineWidth = 1;
                
                // Vertical lines
                for (let x = 0; x < this.width; x += 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, 0);
                    this.ctx.lineTo(x, this.height);
                    this.ctx.stroke();
                }
                
                // Horizontal lines
                for (let y = 0; y < this.height; y += 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, y);
                    this.ctx.lineTo(this.width, y);
                    this.ctx.stroke();
                }
            }

            drawCorrelationLines() {
                // Draw dynamic correlation lines
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.lineWidth = 2;
                
                const numLines = 3;
                for (let i = 0; i < numLines; i++) {
                    const correlation = Math.sin(this.time * 0.001 + i * 2) * 0.8;
                    const startX = this.width * 0.1;
                    const endX = this.width * 0.9;
                    const centerY = this.height * 0.5;
                    const startY = centerY - (endX - startX) * correlation * 0.3;
                    const endY = centerY + (endX - startX) * correlation * 0.3;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.stroke();
                }
            }

            drawPoints() {
                this.points.forEach(point => {
                    // Mouse interaction
                    const dx = this.mouseX - point.x;
                    const dy = this.mouseY - point.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const mouseInfluence = Math.max(0, 1 - distance / 200);
                    
                    // Update position with correlation and mouse influence
                    point.vx += Math.sin(this.time * 0.001 + point.phase) * 0.02;
                    point.vy += Math.cos(this.time * 0.001 + point.phase) * 0.02;
                    
                    // Mouse repulsion/attraction
                    if (mouseInfluence > 0) {
                        const force = mouseInfluence * 0.5;
                        point.vx += (dx / distance) * force * 0.1;
                        point.vy += (dy / distance) * force * 0.1;
                    }
                    
                    // Apply velocity with damping
                    point.x += point.vx;
                    point.y += point.vy;
                    point.vx *= 0.98;
                    point.vy *= 0.98;
                    
                    // Boundary constraints
                    if (point.x < 0 || point.x > this.width) point.vx *= -0.5;
                    if (point.y < 0 || point.y > this.height) point.vy *= -0.5;
                    point.x = Math.max(0, Math.min(this.width, point.x));
                    point.y = Math.max(0, Math.min(this.height, point.y));
                    
                    // Draw point
                    const alpha = point.opacity * (0.5 + mouseInfluence * 0.5);
                    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Draw connections to nearby points
                    this.points.forEach(otherPoint => {
                        if (point !== otherPoint) {
                            const dx = point.x - otherPoint.x;
                            const dy = point.y - otherPoint.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < 100) {
                                const alpha = (100 - distance) / 100 * 0.1;
                                this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
                                this.ctx.lineWidth = 1;
                                this.ctx.beginPath();
                                this.ctx.moveTo(point.x, point.y);
                                this.ctx.lineTo(otherPoint.x, otherPoint.y);
                                this.ctx.stroke();
                            }
                        }
                    });
                });
            }

            animate() {
                this.time = Date.now();
                
                this.ctx.clearRect(0, 0, this.width, this.height);
                
                this.drawGrid();
                this.drawCorrelationLines();
                this.drawPoints();
                
                requestAnimationFrame(() => this.animate());
            }
        }

        // Initialize background
        const statsCanvas = document.getElementById('statsCanvas');
        const background = new StatisticalBackground(statsCanvas);

        // Original socket code
        const socket = io();
        const joinBtn = document.getElementById('joinBtn');
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        const status = document.getElementById('status');
        const statusText = document.getElementById('statusText');
        const roomCodeSection = document.getElementById('roomCodeSection');
        const roomCreatedSection = document.getElementById('roomCreatedSection');
        const roomCodeInput = document.getElementById('roomCodeInput');
        const joinByCodeBtn = document.getElementById('joinByCodeBtn');
        const cancelJoinBtn = document.getElementById('cancelJoinBtn');
        const roomCodeDisplay = document.getElementById('roomCodeDisplay');
        const copyCodeBtn = document.getElementById('copyCodeBtn');

        let currentRoomId = null;

        // Quick match functionality
        joinBtn.addEventListener('click', () => {
            hideAllSections();
            joinBtn.disabled = true;
            status.classList.remove('hidden');
            socket.emit('join-queue');
        });

        // Create room functionality
        createRoomBtn.addEventListener('click', () => {
            hideAllSections();
            createRoomBtn.disabled = true;
            socket.emit('create-room');
        });

        // Join room functionality
        joinRoomBtn.addEventListener('click', () => {
            hideAllSections();
            roomCodeSection.classList.remove('hidden');
            roomCodeInput.focus();
        });

        // Join by code functionality
        joinByCodeBtn.addEventListener('click', () => {
            const roomCode = roomCodeInput.value.trim().toLowerCase();
            if (roomCode) {
                roomCodeSection.classList.add('hidden');
                status.classList.remove('hidden');
                statusText.textContent = 'Joining room...';
                socket.emit('join-room-by-id', { roomId: roomCode });
            }
        });

        // Cancel join functionality
        cancelJoinBtn.addEventListener('click', () => {
            hideAllSections();
            roomCodeInput.value = '';
        });

        // Copy room code functionality
        copyCodeBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(currentRoomId);
                copyCodeBtn.textContent = '✓';
                setTimeout(() => {
                    copyCodeBtn.textContent = '📋';
                }, 2000);
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = currentRoomId;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                copyCodeBtn.textContent = '✓';
                setTimeout(() => {
                    copyCodeBtn.textContent = '📋';
                }, 2000);
            }
        });

        // Enter key for room code input
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinByCodeBtn.click();
            }
        });

        function hideAllSections() {
            status.classList.add('hidden');
            roomCodeSection.classList.add('hidden');
            roomCreatedSection.classList.add('hidden');
        }

        function resetButtons() {
            joinBtn.disabled = false;
            createRoomBtn.disabled = false;
            joinRoomBtn.disabled = false;
        }

        // Socket event handlers
        socket.on('waiting-for-match', () => {
            status.classList.remove('matched');
            status.classList.add('waiting');
            statusText.textContent = 'Waiting for another player...';
        });

        socket.on('room-created', (roomData) => {
            hideAllSections();
            currentRoomId = roomData.roomId;
            roomCodeDisplay.textContent = roomData.roomId;
            roomCreatedSection.classList.remove('hidden');
            status.classList.remove('hidden');
            status.classList.add('waiting');
            statusText.textContent = 'Waiting for your friend to join...';
        });

        socket.on('room-waiting', (data) => {
            status.classList.remove('hidden');
            status.classList.add('waiting');
            statusText.textContent = data.message;
        });

        socket.on('room-join-error', (error) => {
            hideAllSections();
            resetButtons();
            alert(error.message);
        });

        socket.on('room-matched', (roomData) => {
            status.classList.remove('waiting');
            status.classList.add('matched');
            statusText.textContent = 'Match found! Starting game...';
            setTimeout(() => {
                const initialDataParam = encodeURIComponent(JSON.stringify(roomData.initialData));
                const playerIndex = roomData.playerIndex[socket.id];
                window.location.href = `/game.html?room=${roomData.roomId}&correlation=${roomData.correlation}&initialData=${initialDataParam}&playerIndex=${playerIndex}&currentTurn=${roomData.currentTurn}&pointsInCurrentTurn=${roomData.pointsInCurrentTurn}&maxPointsPerTurn=${roomData.maxPointsPerTurn}&turnStartTime=${roomData.turnStartTime}&turnDuration=${roomData.turnDuration}`;
            }, 1000);
        });

        socket.on('user-disconnected', () => {
            status.classList.remove('matched');
            status.classList.add('waiting');
            statusText.textContent = 'Other player disconnected. Waiting for new match...';
            resetButtons();
        });
    </script>
</body>
</html>
```

