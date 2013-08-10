
THREE.Plane3RandGeometry = function ( width, height, widthSegments, heightSegments ) {

    THREE.Geometry.call( this );

    var ix, iz,
        width_half = width / 2,
        height_half = height / 2,
        gridX = widthSegments || 1,
        gridZ = heightSegments || 1,
        gridX1 = gridX + 1,
        gridZ1 = gridZ + 1,
        segment_width = width / gridX,
        segment_height = height / gridZ,
        normal = new THREE.Vector3( 0, 0, 1 );

    for ( iz = 0; iz < gridZ1; iz ++ ) {

        for ( ix = 0; ix < gridX1; ix ++ ) {

            var x = ix * segment_width - width_half;
            var y = iz * segment_height - height_half;

            this.vertices.push( new THREE.Vector3( x, - y, 0 ) );

        }

    }

    for ( iz = 0; iz < gridZ; iz ++ ) {

        for ( ix = 0; ix < gridX; ix ++ ) {

            var a = ix + gridX1 * iz;
            var b = ix + gridX1 * ( iz + 1 );
            var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
            var d = ( ix + 1 ) + gridX1 * iz;

            var rnd = Math.random();
            if (rnd < 0.50)	 {
                var face = new THREE.Face3( a, b, c );
                face.normal.copy( normal );
                face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
                this.faces.push( face );

                var face2 = new THREE.Face3( c, d, a );
                face2.normal.copy( normal );
                face2.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
                this.faces.push( face2 );

                this.faceVertexUvs[ 0 ].push( [
                    new THREE.Vector2( ix / gridX, 1 - iz / gridZ ),					//A
                    new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ ),			//B
                    new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ )	//C
                ] );

                this.faceVertexUvs[ 0 ].push( [
                    new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),	//C
                    new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ ),			//D
                    new THREE.Vector2( ix / gridX, 1 - iz / gridZ )					//A
                ] );
            } else {
                var face3 = new THREE.Face3( b, c, d );
                face3.normal.copy( normal );
                face3.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
                this.faces.push( face3 );

                var face4 = new THREE.Face3( d, a, b );
                face4.normal.copy( normal );
                face4.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
                this.faces.push( face4 );

                this.faceVertexUvs[ 0 ].push( [
                    new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ ),			//B
                    new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),	//C
                    new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ )			//D
                ] );

                this.faceVertexUvs[ 0 ].push( [
                    new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ ),			//D
                    new THREE.Vector2( ix / gridX, 1 - iz / gridZ ),					//A
                    new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ )			//B
                ] );
            }
        }

    }

    this.computeCentroids();

};

THREE.Plane3RandGeometry.prototype = Object.create( THREE.Geometry.prototype );


THREE.Plane3Geometry = function ( width, height, widthSegments, heightSegments ) {

    THREE.Geometry.call( this );

    var ix, iz,
        width_half = width / 2,
        height_half = height / 2,
        gridX = widthSegments || 1,
        gridZ = heightSegments || 1,
        gridX1 = gridX + 1,
        gridZ1 = gridZ + 1,
        segment_width = width / gridX,
        segment_height = height / gridZ,
        normal = new THREE.Vector3( 0, 0, 1 );

    for ( iz = 0; iz < gridZ1; iz ++ ) {

        for ( ix = 0; ix < gridX1; ix ++ ) {

            var x = ix * segment_width - width_half;
            var y = iz * segment_height - height_half;

            this.vertices.push( new THREE.Vector3( x, - y, 0 ) );

        }

    }

    for ( iz = 0; iz < gridZ; iz ++ ) {

        for ( ix = 0; ix < gridX; ix ++ ) {

            var a = ix + gridX1 * iz;
            var b = ix + gridX1 * ( iz + 1 );
            var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
            var d = ( ix + 1 ) + gridX1 * iz;

            /*var face = new THREE.Face4( a, b, c, d );
             face.normal.copy( normal );
             face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );

             this.faces.push( face );
             this.faceVertexUvs[ 0 ].push( [
             new THREE.UV( ix / gridX, 1 - iz / gridZ ),
             new THREE.UV( ix / gridX, 1 - ( iz + 1 ) / gridZ ),
             new THREE.UV( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),
             new THREE.UV( ( ix + 1 ) / gridX, 1 - iz / gridZ )
             ] );*/


            var face = new THREE.Face3( a, b, c );
            face.normal.copy( normal );
            face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
            this.faces.push( face );
            /*this.faceVertexUvs[ 0 ].push( [
             new THREE.UV( ix / gridX, 1 - iz / gridZ ),
             new THREE.UV( ix / gridX, 1 - ( iz + 1 ) / gridZ ),
             new THREE.UV( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ )
             ] );*/

            var face2 = new THREE.Face3( c, d, a );
            face2.normal.copy( normal );
            face2.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
            this.faces.push( face2 );
            /*this.faceVertexUvs[ 0 ].push( [
             new THREE.UV( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),
             new THREE.UV( ( ix + 1 ) / gridX, 1 - iz / gridZ ),
             new THREE.UV( ix / gridX, 1 - iz / gridZ ),
             ] );*/

            /*			this.faceVertexUvs[ 0 ].push( [
             new THREE.UV( ix / gridX, 1 - iz / gridZ ),
             new THREE.UV( ix / gridX, 1 - ( iz + 1 ) / gridZ ),
             new THREE.UV( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),
             new THREE.UV( ( ix + 1 ) / gridX, 1 - iz / gridZ )
             ] );
             */
            this.faceVertexUvs[ 0 ].push( [
                new THREE.Vector2( ix / gridX, 1 - iz / gridZ ),			//A
                new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ ),		//B
                new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ )	//C
            ] );

            this.faceVertexUvs[ 0 ].push( [
                new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),	//C
                new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ ),		//D
                new THREE.Vector2( ix / gridX, 1 - iz / gridZ )			//A
            ] );

        }

    }

    this.computeCentroids();

};

THREE.Plane3Geometry.prototype = Object.create( THREE.Geometry.prototype );

function generateHeight( width, height ) {

    var size = width * height, data = new Float32Array( size ),
        perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

    for ( var i = 0; i < size; i ++ ) {

        data[ i ] = 0

    }

    for ( var j = 0; j < 4; j ++ ) {

        for ( var i = 0; i < size; i ++ ) {

            var x = i % width, y = ~~ ( i / width );
            data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );


        }

        quality *= 5;

    }

    return data;

}