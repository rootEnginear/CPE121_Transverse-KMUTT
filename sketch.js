var pathMap;

var cols = 100;
var rows = 100;
var grid = new Array(cols);

var openSet = [];
var closedSet = [];
var start,
  end,
  path = [];
var w, h;
var stopdraw = false, finalPath = false;

p5.disableFriendlyErrors = true;

function preload() {
  pathMap = loadImage("./mapkmuttsmall.png");
  realMap = loadImage("./kmuttmapresize.jpg")
}

class Node {
  constructor(i, j, iswall = false) {
    this.i = i;
    this.j = j;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.neighbors = [];
    this.previous = undefined;
    this.wall = iswall;

    this.show = function (color = color(85, 85, 85, 125)) {
      if (this.wall) {
        noStroke();
        noFill();
      } else {
        stroke(0, 0, 0, 50);
        strokeWeight(1);
        fill(color);
      }
      rect(this.i * w, this.j * h, w, h);
    };

    this.addNeighbors = function (grid) {
      this.i < cols - 1 && this.neighbors.push(grid[this.i + 1][this.j]);
      this.i > 0 && this.neighbors.push(grid[this.i - 1][this.j]);
      this.j < rows - 1 && this.neighbors.push(grid[this.i][this.j + 1]);
      this.j > 0 && this.neighbors.push(grid[this.i][this.j - 1]);

      this.i > 0 && this.j > 0 && this.neighbors.push(grid[this.i - 1][this.j - 1]);
      this.i < cols - 1 && this.j > 0 && this.neighbors.push(grid[this.i + 1][this.j - 1]);
      this.i > 0 && this.j < rows - 1 && this.neighbors.push(grid[this.i - 1][this.j + 1]);
      this.i < cols - 1 && this.j < rows - 1 && this.neighbors.push(grid[this.i + 1][this.j + 1]);
    };

    this.clicked = function (e) {
      var d = abs(mouseX - (this.i * w + w / 2)) + abs(mouseY - (this.j * h + h / 2));

      if (d < w / 2 + h / 2 && !this.wall && start != grid[this.i][this.j] && end != grid[this.i][this.j]) {
        grid.map(col => {
          col.map(cell => {
            cell.f = 0;
            cell.g = 0;
            cell.h = 0;
            cell.neighbors = [];
            cell.previous = undefined;
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
  return max(dx, dy); // Cherbyshev
  // return abs(a.i-b.i)+abs(a.j-b.j) // Manhattan
  // return dist(a.i, a.j, b.i, b.j); // Euclidean
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
      var c = get(i, j);
      grid[i][j] = new Node(i, j, c[0] == 0);
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

      // find the winner for the least 'f' value
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

      // get current's neighbors
      var neighbors = current.neighbors;

      neighbors.forEach(neighbor => {
        // if the neighbor haven't visit yet and not a wall
        if (!closedSet.includes(neighbor) && !neighbor.wall) {
          var tempG = current.g + 1;

          /*
           * So I want to refactorize this:
           * // if (openSet.includes(neighbor)) {
           * //   if (tempG < neighbor.g) {
           * //     <-- foo -->
           * //   }
           * // } else {
           * //   <-- foo -->
           * //   openSet.push(neighbor);
           * // }
           * // ...
           * So I rewrite this statement into:
           * if((not include) xor (tempG < neighbor.g)){::foo}
           * Since foo xor bar === !foo != !bar, Thus I used statement below
           **/
          if (!(!openSet.includes(neighbor) && openSet.push(neighbor)) != !(tempG < neighbor.g)) {
            neighbor.g = tempG;
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
      if (cell == end) {
        cell.show(color(255, 0, 0));
      } else if (cell == start) {
        cell.show(color(0, 255, 0));
      } else {
        cell.show(color(255, 255, 255, 100));
      }
    })
  })

  // get path
  if (!stopdraw || finalPath) {
    path = [];
    var temp = current;
    path.push(temp);
    while (temp.previous) {
      path.push(temp.previous);
      temp = temp.previous;
    }
    finalPath && ((finalPath = false));
  }

  // DRAW PATH
  noFill();
  if (stopdraw) {
    // stroke(color(0, 158, 219));
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
}

function mousePressed() {
  grid.forEach(col => {
    col.forEach(cell => {
      cell.clicked(mouseButton);
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