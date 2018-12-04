// variables for map
var pathMap, realMap;

// variables for grid
var cols = 100, rows = 100, grid = new Array(cols);
var w, h;

// variables for algorithm
var openSet = [], closedSet = [], start, end, path = [];
var stopdraw = false, finalPath = false;

// 4-dir Mode
var dir4mode = false;

// dijkstra mode
var dijkstra = false;

p5.disableFriendlyErrors = true;

function preload() {
  pathMap = loadImage("./mapkmuttsmall.png");
  realMap = loadImage("./kmuttmapresize.jpg")
}

class Node {
  constructor(i, j) {
    // position
    this.i = i;
    this.j = j;
    // values
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.neighbors = [];
    this.previous = undefined;

    this.show = function (bg = color(255, 255, 255, 100)) {
      stroke(0, 0, 0, 50);
      strokeWeight(1);
      fill(bg);
      rect(this.i * w, this.j * h, w, h);
    };

    this.addNeighbors = function (grid) {
      this.i < cols - 1 && this.neighbors.push(grid[this.i + 1][this.j]);
      this.i > 0 && this.neighbors.push(grid[this.i - 1][this.j]);
      this.j < rows - 1 && this.neighbors.push(grid[this.i][this.j + 1]);
      this.j > 0 && this.neighbors.push(grid[this.i][this.j - 1]);

      if(!dir4mode){
        this.i > 0 && this.j > 0 && this.neighbors.push(grid[this.i - 1][this.j - 1]);
        this.i < cols - 1 && this.j > 0 && this.neighbors.push(grid[this.i + 1][this.j - 1]);
        this.i > 0 && this.j < rows - 1 && this.neighbors.push(grid[this.i - 1][this.j + 1]);
        this.i < cols - 1 && this.j < rows - 1 && this.neighbors.push(grid[this.i + 1][this.j + 1]);
      }
    };

    // onclick: move starting/ending point to this node position
    this.clicked = function (e) {
      var d = abs(mouseX - (this.i * w + w / 2)) + abs(mouseY - (this.j * h + h / 2));

      if (d < w / 2 + h / 2 && start != grid[this.i][this.j] && end != grid[this.i][this.j]) {
        grid.map(col => {
          col.map(cell => {
            if(cell){
              cell.f = 0;
              cell.g = 0;
              cell.h = 0;
              cell.neighbors = [];
              cell.previous = undefined;
            }
          });
        });

        updateHTML(0);

        if (e === "left") {
          console.info("Set start", this.i, this.j);
          start = grid[this.i][this.j];
        } else {
          console.info("Set end", this.i, this.j);
          end = grid[this.i][this.j];
        }

        openSet = [];
        openSet.push(start);
        closedSet = [];
        path = [];
        stopdraw = false;
      }
    };
  }
}

function heuristic(a, b) {
  var dx = abs(a.i - b.i), dy = abs(a.j - b.j);
  // return dist(a.i, a.j, b.i, b.j); // Euclidean
  if(dijkstra){
    return 0;
  }
  if(dir4mode){
    return dx+dy; // Manhattan
  }else{
    return max(dx, dy); // Cherbyshev
  }
}

function setup() {
  var canvas = createCanvas(500, 500);
  canvas.parent("map");

  pixelDensity(1);

  w = width / cols;
  h = height / rows;

  for (var i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
  }

  // loadmap
  image(pathMap, 0, 0);

  // create nodes
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j] = get(i, j)[0] == 0? null : new Node(i, j);
    }
  }

  // Start: Library, End: Vidsava Wattana
  start = grid[63][45];
  end = grid[25][50];

  // push starting point for openset
  openSet.push(start);
}

function draw() {
  background(0);
  // draw kmutt map
  image(realMap, 0, 0);

  if (!stopdraw) {
    // read set length
    var openSetLen = openSet.length;
    if (openSetLen > 0) {
      // there are nodes in openSet -> keep going
      // find the winner with the least 'f' value
      var winner = 0;
      for (var i = 0; i < openSetLen; i++) {
        openSet[i].f < openSet[winner].f && (winner = i);
      }

      // set current to the least 'f' value node
      var current = openSet[winner];

      // check if current is the end
      if (current == end) {
        stopdraw = true;
        finalPath = true;
        updateHTML(1);
        console.info("DONE!");
      }

      // move current from the openSet to closedSet
      var len = openSet.length;
      for (var i = len - 1; i >= 0; i--) {
        if (openSet[i] == current) {
          openSet.splice(i, 1);
        }
      }
      closedSet.push(current);

      // add current neighbors
      current.addNeighbors(grid);

      // get current's neighbors that is not null
      var neighbors = current.neighbors.filter(node => node);

      neighbors.forEach(neighbor => {
        // if the neighbor haven't visit yet
        if (!closedSet.includes(neighbor)) {
          // new G for neighbor
          var newG = current.g + 1;

          // 1. if openSet doesn't have neighbor -> add it
          // 2. if openSet does have neighbor but newG is >= neighbor's g
          if (!(!openSet.includes(neighbor) && openSet.push(neighbor)) != !(newG < neighbor.g)) {
            neighbor.g = newG;
            neighbor.h = heuristic(neighbor, end);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.previous = current;
          }
        }
      })
    } else {
      // no solution
      stopdraw = true;
      finalPath = true;
      updateHTML(-1);
      console.info("No solution!");
    }
  }

  // draw cell
  grid.forEach(col => {
    col.forEach(cell => {
      cell && cell != start && cell != end && cell.show();
    })
  })

  // get path
  if (!stopdraw || finalPath) {
    path = [];
    var temp = current;
    path.push(temp,temp);
    while (temp.previous) {
      path.push(temp.previous);
      temp = temp.previous;
    }
    path.push(temp);
    finalPath && (finalPath = false);
  }

  // draw path
  noFill();
  if (stopdraw) {
    stroke(color(255, 255, 0));
  } else {
    stroke(color(242, 101, 34));
  }
  strokeWeight(w * 0.7);

  beginShape();
  path.forEach(e => {
    curveVertex(e.i * w + w / 2, e.j * h + h / 2)
  })
  endShape();

  // draw start/end
  end.show(color(255, 0, 0));
  start.show(color(0, 255, 0));
}

function mousePressed() {
  grid.forEach(col => {
    col.forEach(cell => {
      cell && cell.clicked(mouseButton);
    });
  });
}

function updateHTML(status = 0) {
  var el = document.getElementById("statusBox");
  switch (status) {
    case -1:
      el.classList.remove("toast-warning");
      el.classList.add("toast-error");
      el.innerText = "No solution found!";
      break;
    case 0:
      el.classList.remove("toast-error", "toast-success");
      el.classList.add("toast-warning");
      el.innerText = "Searching...";
      break;
    case 1:
      el.classList.remove("toast-warning");
      el.classList.add("toast-success");
      el.innerText = "Path found!";
      break;
  }
}