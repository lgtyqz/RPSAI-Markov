"use strict";
(function(){
    window.addEventListener("load", init);

    const OPTIONS = ["ROCK", "PAPER", "SCISSORS"];
    const OUTCOMES = ["LOSE", "TIE", "WIN"];
    const WIN_TABLE = [
        [1, 0, 2],
        [2, 1, 0],
        [0, 2, 1]
    ];

    let totalGames = 0;
    let previousState = 0;
    let wonGames = 0;
    let playerWonGames = 0;
    let markovChain = [];
    let gamesUntilInsight = 64;
    for(let i = 0; i < OUTCOMES.length * OPTIONS.length; i++){
        let row = [];
        for(let j = 0; j < OPTIONS.length; j++){
            row.push(0);
        }
        markovChain.push(row);
    }

    function init(){
        let buttons = document.querySelectorAll(".option");
        for(let i = 0; i < buttons.length; i++){
            buttons[i].addEventListener("click", playTurn);
        }
    }

    function playTurn(event){
        // choose
        let playerChoice = parseInt(event.currentTarget.id);
        let raw_probs = markovChain[previousState];
        let raw_prob_total = 0;
        for(let i = 0; i < raw_probs.length; i++){
            raw_prob_total += raw_probs[i] + 1;
        }
        let partition = Math.random();
        let cumulative = 0;
        let choice = 0;
        for(let i = 0; i < raw_probs.length; i++){
            let probability = (markovChain[previousState][i] + 1)/(raw_prob_total);
            cumulative += probability;
            if(cumulative > partition){
                choice = i;
                break;
            }
        }

        // display results
        let result = WIN_TABLE[playerChoice][choice];
        let resultsUI = document.getElementById("results");
        resultsUI.innerText = "You threw " + OPTIONS[playerChoice] + 
                                "!\n Computer threw " + OPTIONS[choice] + 
                                "! You got a " + OUTCOMES[result] + "!";
        totalGames += 1;
        if(OUTCOMES[result] == "LOSE"){
            wonGames += 1;
        } else if(OUTCOMES[result] == "WIN"){
            playerWonGames += 1;
        }
        let winrateLabel = document.getElementById("player-winrate");
        let aiWinrate = document.getElementById("ai-winrate");
        let gamesLabel = document.getElementById("total-games");
        winrateLabel.innerText = Math.round(playerWonGames/totalGames * 100) + "%";
        aiWinrate.innerText = Math.round(wonGames/totalGames * 100) + "%";
        gamesLabel.innerText = totalGames;
        displayInsights();

        console.log(markovChain);

        // learn
        let currentState = result * 3 + playerChoice;
        let winningMove = (playerChoice + 1) % OPTIONS.length;
        let learningScenario = markovChain[previousState][winningMove];
        markovChain[previousState][winningMove] = learningScenario + 1;
        previousState = currentState;
    }

    function displayInsights(){
        let insightLabel = document.getElementById("insight");
        if(gamesUntilInsight > 0){
            insightLabel.innerHTML = "<span class=\"white-emphasis\">" +
                                    gamesUntilInsight + "</span> games until insight revealed!";
            gamesUntilInsight--;
        }else{
            let insightText = "";
            let insightList = [];
            gamesUntilInsight = 16;
            for(let row = 0; row < markovChain.length; row++){
                let lowNumberCount = 0;
                let moves = [0, 1, 2];
                let predictiveMove = OPTIONS[row % 3];
                let state = OUTCOMES[Math.floor(row/3)];
                for(let col = 0; col < markovChain.length; col++){
                    let losingMove = (col + OPTIONS.length - 1) % OPTIONS.length;
                    losingMove = OPTIONS[losingMove];
                    if(markovChain[row][col] == 0){
                        insightList.push("When you play " + predictiveMove + " and " +
                                        state + ", you never play " + losingMove + "\n");
                        lowNumberCount++;
                        moves.splice(col, 1);
                    }else if(markovChain[row][col] < 2 ||
                        markovChain[row][col] < totalGames/(OUTCOMES.length * (OPTIONS.length ** 2))){
                        insightList.push("When you play " + predictiveMove + " and " +
                                        state + ", you almost never play " + losingMove + "\n");
                        lowNumberCount++;
                        moves.splice(col, 1);
                    }
                }
                if(lowNumberCount == OPTIONS.length - 1){
                    let losingMove = (moves[0] + OPTIONS.length - 1) % OPTIONS.length;
                    losingMove = OPTIONS[losingMove];
                    insightList = insightList.slice(0, insightList.length - 2);
                    insightList.push("When you play " + predictiveMove + " and " +
                                        state + ", you mostly play " + losingMove + "\n");
                }
            }
            for(let row = 0; row < insightList.length; row++){
                insightText += insightList[row];
            }
            insightLabel.innerText = insightText;
        }
    }
})();