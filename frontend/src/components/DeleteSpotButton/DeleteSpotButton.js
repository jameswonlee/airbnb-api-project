import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { deleteSpot } from '../../store/spots';
import { Modal } from "../../context/Modal";
import './DeleteSpot.css'


function DeleteSpotButton() {
    const dispatch = useDispatch();
    const history = useHistory();
    const { spotId } = useParams();
    const [shown, setShown] = useState(false);

    const showModal = () => {
        setShown(true);
    }

    const hideModal = () => {
        setShown(false);
    }

    const deleteClickHandler = (e) => {
        dispatch(deleteSpot(spotId));
        alert('Spot successfully deleted');
        history.push('/');
    }

    return (
        <div className="delete-button-content">
            <button className="delete-button" onClick={showModal}>
                Delete Spot
            </button>
            {shown &&
                <Modal onClose={hideModal}>
                    <div className="delete-spot">
                        <h3>Are you sure you want to delete this spot?</h3>
                        <p>This action can't be undone.</p>
                        <div className='delete-buttons'>
                            <button className="confirm-delete-button" onClick={deleteClickHandler}>
                                Confirm Delete
                            </button>
                            <button className="cancel-delete-button" onClick={hideModal}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>}
        </div>
    )
}


export default DeleteSpotButton;